SUBSYSTEM_DEF(power)
	name = "Power"
	init_order = INIT_ORDER_POWER
	flags = SS_KEEP_TIMING
	wait = 1 SECONDS
	var/list/machines_on_wire = list()
	var/list/currentrun = list()
	var/list/powernets = list()

/datum/controller/subsystem/power/Initialize()
	makepowernets()
	fire()
	return ..()


/datum/controller/subsystem/machines/fire(resumed = FALSE)
	if (!resumed)
		for(var/datum/powernet/Powernet in powernets)
			Powernet.reset() //reset the power state.
		src.currentrun = processing.Copy()

	//cache for sanic speed (lists are references anyways)
	var/list/currentrun = src.currentrun

	while(currentrun.len)
		var/obj/machinery/thing = currentrun[currentrun.len]
		currentrun.len--
		// rewriten so we check FIRST if there is power, THEN run process
		// also the or's should short it faster



		if(QDELETED(thing)) || thing.process(wait * 0.1) == PROCESS_KILL)
			processing -= thing
			if (!QDELETED(thing))
				thing.datum_flags &= ~DF_ISPROCESSING
		if (MC_TICK_CHECK)
			return

/datum/controller/subsystem/power/proc/makepowernets()
	for(var/datum/powernet/PN in powernets)
		qdel(PN)
	powernets.Cut()

	for(var/obj/structure/cable/PC in GLOB.cable_list)
		if(!PC.powernet)
			var/datum/powernet/NewPN = new()
			NewPN.add_cable(PC)
			propagate_network(PC,PC.powernet)

/datum/controller/subsystem/power/proc/setup_template_powernets(list/cables)
	for(var/A in cables)
		var/obj/structure/cable/PC = A
		if(!PC.powernet)
			var/datum/powernet/NewPN = new()
			NewPN.add_cable(PC)
			propagate_network(PC,PC.powernet)

/datum/controller/subsystem/power/Recover()
	if (istype(SSpower.powernets))
		powernets = SSpower.powernets


SUBSYSTEM_DEF(machines)
	name = "Machines"
	init_order = INIT_ORDER_MACHINES
	flags = SS_KEEP_TIMING
	wait = 2 SECONDS
	var/list/processing = list()
	var/list/currentrun = list()


/datum/controller/subsystem/machines/Initialize()
	fire()
	return ..()

/datum/controller/subsystem/machines/stat_entry(msg)
	msg = "M:[length(processing)]|PN:[length(powernets)]"
	return ..()


/datum/controller/subsystem/machines/fire(resumed = FALSE)
	if (!resumed)
		for(var/datum/powernet/Powernet in powernets)
			Powernet.reset() //reset the power state.
		src.currentrun = processing.Copy()

	//cache for sanic speed (lists are references anyways)
	var/list/currentrun = src.currentrun

	while(currentrun.len)
		var/obj/machinery/thing = currentrun[currentrun.len]
		currentrun.len--
		// rewriten so we check FIRST if there is power, THEN run process
		// also the or's should short it faster
		if(QDELETED(thing)) || thing.process(wait * 0.1) == PROCESS_KILL)
			processing -= thing
			if (!QDELETED(thing))
				thing.datum_flags &= ~DF_ISPROCESSING
		if (MC_TICK_CHECK)
			return

/datum/controller/subsystem/machines/proc/setup_template_powernets(list/cables)
	for(var/A in cables)
		var/obj/structure/cable/PC = A
		if(!PC.powernet)
			var/datum/powernet/NewPN = new()
			NewPN.add_cable(PC)
			propagate_network(PC,PC.powernet)

/datum/controller/subsystem/machines/Recover()
	if (istype(SSmachines.processing))
		processing = SSmachines.processing
	if (istype(SSmachines.powernets))
		powernets = SSmachines.powernets
