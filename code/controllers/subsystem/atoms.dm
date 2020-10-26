#define BAD_INIT_QDEL_BEFORE 1
#define BAD_INIT_DIDNT_INIT 2
#define BAD_INIT_SLEPT 4
#define BAD_INIT_NO_HINT 8

SUBSYSTEM_DEF(atoms)
	name = "Atoms"
	init_order = INIT_ORDER_ATOMS
	flags = SS_NO_FIRE

	var/old_initialized

	var/list/BadInitializeCalls = list()

	// atmos created during a atom/new but is queued
	// This is an assicated list with the key being the atom and the value being the arguments
	var/list/atoms_queue = list()
	// atoms created by datum/map_helpers.  Run after the normal world has been made
	// Same as atoms_queue, so maphelpers can send custom Initialize args to the obj they create
	var/list/maphelpers_queue = list()
	// Late loader que is the same as the atoms queue.  Its is filled if we are queuing lateinit calls
	var/list/late_loaders = list()

	initialized = INITIALIZATION_INSSATOMS

/datum/controller/subsystem/atoms/Initialize(timeofday)
	GLOB.fire_overlay.appearance_flags = RESET_COLOR
	setupGenetics() //to set the mutations' sequence
	InitializeWorld()
	return ..()

/datum/controller/subsystem/atoms/proc/InitializeWorld()
	initialized = INITIALIZATION_INNEW_QUEUE // all new items created because of map_helpers will be queued
#ifdef TESTING
	var/count = 0
#endif
	var/list/mapload_arg = list(TRUE)
	for(var/atom/A in world)
		if(!(A.flags_1 & INITIALIZED_1))
			_init_atom(A, mapload_arg)
			CHECK_TICK
#ifdef TESTING
			++count
	testing("process_world: Initialized [count] atoms")
#endif

	process_late_loaders()
	// scrub the queue cleaaan
	scrub_queue()
	initialized = INITIALIZATION_INNEW_REGULAR // now we are holy

/// Init this specific atom, ONLY RUN OUTSIDE OF THIS FILE USING INITIALIZE_IMMEDIATE
/datum/controller/subsystem/atoms/proc/InitAtomImmediate(atom/A, list/arguments)
	_init_atom(A, arguments)

// Used by atoms at the end of New
/datum/controller/subsystem/atoms/proc/InitAtom(atom/A, list/arguments)
	if(initialized == INITIALIZATION_INSSATOMS)
		return
	if(initialized == INITIALIZATION_INNEW_QUEUE)
		atoms_queue[A] = arguments
		return
	_init_atom(A, arguments)


/datum/controller/subsystem/atoms/proc/MapLoadAtomsInitialize(list/map_atoms)
	initialized = INITIALIZATION_INNEW_REGULAR // switch to regular mode so users don't clobber atoms_queue
#ifdef TESTING
	var/count = 0
#endif
	var/list/map_args
	var/list/assoc_map_atoms = list()
	// so to stop race conditions from items created in station we MUST seperate the
	// map things from normal things
	for(var/i in 1 to map_atoms.len)
		var/atom/A = map_atoms[i]
		if(!atoms_queue[A])
			continue
		assoc_map_atoms[A] = map_atoms[A] 	// get its args
		atoms_queue.Remove(A)				// remove it from the queue
#ifdef TESTING
		count++
#endif
	_process_atom_queue(assoc_map_atoms,TRUE, TRUE)	// init the map atoms
	_process_late_loaders()					 			// run the late loaders


#ifdef TESTING
	testing("MapLoadAtomsInitialize: Initialized [count] atoms")
#endif


// this is only run on template starts
/datum/controller/subsystem/atoms/proc/map_loader_begin()
	if(initialized == INITIALIZATION_INSSATOMS)
		return
	old_initialized = initialized
	initialized = INITIALIZATION_INNEW_QUEUE

/datum/controller/subsystem/atoms/proc/scrub_queue(override_map_new=null)
	// scrub the queue cleaaan
	var/list/L
	while(atoms_queue.len)		// Process any maphelpers that need a second build call
		L = atoms_queue
		atoms_queue = list()
		_process_atom_queue(L, TRUE, override_map_new)
		_process_late_loaders()
		L.Cut()
		L = null

/datum/controller/subsystem/atoms/proc/map_loader_stop()
	if(initialized == INITIALIZATION_INSSATOMS)
		return
	initialized = INITIALIZATION_INNEW_REGULAR
	scrub_queue(FALSE)	// make sure we don't have any items left on the queue


// queue must be an associated list
/datum/controller/subsystem/atoms/proc/_process_atom_queue(list/queue, queue_lateinitialize=FALSE, override_mapload=null)
	var/count = atoms.len
	for(var/I in queue)
		var/atom/A = I
		if(A.flags_1 & INITIALIZED_1)
			continue // just skip it
		var/list/atom_args = queue[I]
		if(!isnull(override_mapload))
			atom_args[1] = override_mapload
		_init_atom(I, atom_args, queue_lateinitialize)
		count++
		CHECK_TICK

	return count



/datum/controller/subsystem/atoms/proc/_init_atom(atom/A, list/arguments, queue_lateinitialize=FALSE)
	PRIVATE_PROC(TRUE)
	var/the_type = A.type
	if(QDELING(A))
		BadInitializeCalls[the_type] |= BAD_INIT_QDEL_BEFORE
		return TRUE

	var/start_tick = world.time

	var/result = A.Initialize(arglist(arguments))

	if(start_tick != world.time) // this really needs a stack trace, you cannot sleep in Init
#ifdef DEBUG
		stack_trace("Atom [A] has a sleep in Initialize!")
#endif
		BadInitializeCalls[the_type] |= BAD_INIT_SLEPT

	var/qdeleted = FALSE

	if(result != INITIALIZE_HINT_NORMAL)
		switch(result)
			if(INITIALIZE_HINT_LATELOAD)
				if(queue_lateinitialize || arguments[1])	//mapload
					late_loaders += A
				else
					A.LateInitialize()
			if(INITIALIZE_HINT_QDEL)
				qdel(A)
				qdeleted = TRUE
			else
				BadInitializeCalls[the_type] |= BAD_INIT_NO_HINT

	if(!A)	//possible harddel
		qdeleted = TRUE
	else if(!(A.flags_1 & INITIALIZED_1))
		BadInitializeCalls[the_type] |= BAD_INIT_DIDNT_INIT
	else
		SEND_SIGNAL(A,COMSIG_ATOM_AFTER_SUCCESSFUL_INITIALIZE)

	return qdeleted || QDELING(A)

/datum/controller/subsystem/atoms/proc/_process_late_loaders()
	if(late_loaders.len)
		for(var/I in late_loaders)
			var/atom/A = I
			A.LateInitialize() // no need for CHECK_TICK, LateInitialize wait_for = TRUE
		testing("Late initialized [late_loaders.len] atoms")
		late_loaders.Cut()


/datum/controller/subsystem/atoms/Recover()
	initialized = SSatoms.initialized
	if(initialized == INITIALIZATION_INNEW_MAPLOAD)
		InitializeAtoms()
	old_initialized = SSatoms.old_initialized
	BadInitializeCalls = SSatoms.BadInitializeCalls

/datum/controller/subsystem/atoms/proc/setupGenetics()
	var/list/mutations = subtypesof(/datum/mutation/human)
	shuffle_inplace(mutations)
	for(var/A in subtypesof(/datum/generecipe))
		var/datum/generecipe/GR = A
		GLOB.mutation_recipes[initial(GR.required)] = initial(GR.result)
	for(var/i in 1 to LAZYLEN(mutations))
		var/path = mutations[i] //byond gets pissy when we do it in one line
		var/datum/mutation/human/B = new path ()
		B.alias = "Mutation [i]"
		GLOB.all_mutations[B.type] = B
		GLOB.full_sequences[B.type] = generate_gene_sequence(B.blocks)
		GLOB.alias_mutations[B.alias] = B.type
		if(B.locked)
			continue
		if(B.quality == POSITIVE)
			GLOB.good_mutations |= B
		else if(B.quality == NEGATIVE)
			GLOB.bad_mutations |= B
		else if(B.quality == MINOR_NEGATIVE)
			GLOB.not_good_mutations |= B
		CHECK_TICK

/datum/controller/subsystem/atoms/proc/InitLog()
	. = ""
	for(var/path in BadInitializeCalls)
		. += "Path : [path] \n"
		var/fails = BadInitializeCalls[path]
		if(fails & BAD_INIT_DIDNT_INIT)
			. += "- Didn't call atom/Initialize()\n"
		if(fails & BAD_INIT_NO_HINT)
			. += "- Didn't return an Initialize hint\n"
		if(fails & BAD_INIT_QDEL_BEFORE)
			. += "- Qdel'd in New()\n"
		if(fails & BAD_INIT_SLEPT)
			. += "- Slept during Initialize()\n"

/datum/controller/subsystem/atoms/Shutdown()
	var/initlog = InitLog()
	if(initlog)
		text2file(initlog, "[GLOB.log_directory]/initialize.log")

#undef BAD_INIT_QDEL_BEFORE
#undef BAD_INIT_DIDNT_INIT
#undef BAD_INIT_SLEPT
#undef BAD_INIT_NO_HINT
