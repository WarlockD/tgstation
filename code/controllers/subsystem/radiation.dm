PROCESSING_SUBSYSTEM_DEF(radiation)
	name = "Radiation"
	flags = SS_NO_INIT | SS_BACKGROUND
	runlevels = RUNLEVEL_GAME | RUNLEVEL_POSTGAME
	priority = FIRE_PRIORITY_ACID // this good enough priority?

	var/list/rad_locs = list()
	var/list/processing = list()

	var/list/warned_atoms = list()

/datum/controller/subsystem/processing/radiation/proc/warn(datum/component/radioactive/contamination)
	if(!contamination || QDELETED(contamination))
		return
	var/ref = REF(contamination.parent)
	if(warned_atoms[ref])
		return
	warned_atoms[ref] = TRUE
	var/atom/master = contamination.parent
	SSblackbox.record_feedback("tally", "contaminated", 1, master.type)
	var/msg = "has become contaminated with enough radiation to contaminate other objects. || Source: [contamination.source] || Strength: [contamination.strength]"
	master.investigate_log(msg, INVESTIGATE_RADIATION)


/datum/controller/subsystem/acid/fire(resumed = 0)
	if (!resumed)
		src.currentrun = processing.Copy()

	//cache for sanic speed (lists are references anyways)
	var/list/currentrun = src.currentrun

	while (currentrun.len)
		var/obj/O = currentrun[currentrun.len]
		currentrun.len--
		if (!O || QDELETED(O))
			processing -= O
			if (MC_TICK_CHECK)
				return
			continue

		if(O.acid_level && O.acid_processing())
		else
			O.update_icon()
			processing -= O

		if (MC_TICK_CHECK)
			return
