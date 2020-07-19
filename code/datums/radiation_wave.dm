

/// Returns true or false to allow the mover to move through src
/atom/proc/CanAllowThrough(atom/movable/mover, turf/target)


/obj/effect/gamma_ray
	name = "gamma ray"
	icon = 'icons/obj/projectiles.dmi' // used for testing right now
	icon_state = "ibeam"
	anchored = TRUE	// atleast to the radation source
	density = FALSE
	pass_flags = PASSTABLE | PASSGLASS | PASSGRILLE | PASSCLOSEDTURF | PASSMACHINE | PASSSTRUCTURE | LETPASSTHROW
	mouse_opacity = MOUSE_OPACITY_TRANSPARENT
	movement_type = FLYING
	resistance_flags = INDESTRUCTIBLE
	var/range_modifier
	var/obj/source
	var/steps_taken
	var/intensity
	/// How much contaminated material it still has

/obj/effect/beam/gamma_ray/Crossed(atom/movable/AM as mob|obj)
	. = ..()
	var/turf/L = obj.loc
	if(l && SSradation.affected_turfs[L])
		++steps_taken
		if(steps_taken>1)
			intensity = INVERSE_SQUARE(intensity, max(range_modifier*steps_taken, 1), 1)
		// first time we entered this turf, collect, and addjust and see if we even bother

		if(intensity<RAD_BACKGROUND_RADIATION)
			SSradation.affected_turfs[L] = -1 // end of the chain but we put -1 here so we don't have to  worry about it
			qdel(src) // do we need this?
		return TRUE

		return // We allready processed this turf
	if(istype(AM, /obj/effect/beam))
		return
	if (isitem(AM))
		var/obj/item/I = AM
		if (I.item_flags & ABSTRACT)
			return
	master.trigger_beam(AM, get_turf(src))


/obj/effect/proc/check_obstructions(list/atoms)
	var/width = steps
	var/cmove_dir = move_dir
	if(cmove_dir == NORTH || cmove_dir == SOUTH)
		width--
	width = 1+(2*width)

	for(var/k in 1 to atoms.len)
		var/atom/thing = atoms[k]
		if(!thing)
			continue
		if (SEND_SIGNAL(thing, COMSIG_ATOM_RAD_WAVE_PASSING, src, width) & COMPONENT_RAD_WAVE_HANDLED)
			continue
		if (thing.rad_insulation != RAD_NO_INSULATION)
			intensity *= (1-((1-thing.rad_insulation)/width))

/datum/radiation_wave
	/// The thing that spawned this radiation wave
	var/source
	/// The center of the wave
	var/turf/master_turf
	/// How far we've moved
	var/steps=0
	/// How strong it was originaly
	var/intensity
	/// How much contaminated material it still has
	var/remaining_contam
	/// Higher than 1 makes it drop off faster, 0.5 makes it drop off half etc
	var/range_modifier
	/// The direction of movement
	var/move_dir
	/// The directions to the side of the wave, stored for easy looping
	var/list/__dirs
	/// Whether or not this radiation wave can create contaminated objects
	var/can_contaminate
	/// Max range not taking in account walls and stuff
	var/max_range

/datum/radiation_wave/New(atom/_source, dir, _intensity=0, _range_modifier=RAD_DISTANCE_COEFFICIENT, _can_contaminate=TRUE)

	source = "[_source] \[[REF(_source)]\]"

	master_turf = get_turf(_source)

	move_dir = dir
	__dirs = list()
	__dirs+=turn(dir, 90)
	__dirs+=turn(dir, -90)

	intensity = _intensity
	remaining_contam = intensity
	range_modifier = _range_modifier
	can_contaminate = _can_contaminate

	// figure a better way than this
	max_range = 2
	while(_intensity > RAD_BACKGROUND_RADIATION)
		_intensity = INVERSE_SQUARE(_intensity, max(range_modifier*max_range, 1), 1)


/proc/circlerange(center=usr,radius=3)

	var/turf/centerturf = get_turf(center)
	var/list/turfs = new/list()
	var/rsq = radius * (radius+0.5)

	for(var/atom/T in range(radius, centerturf))
		var/dx = T.x - centerturf.x
		var/dy = T.y - centerturf.y
		if(dx*dx + dy*dy <= rsq)
			turfs += T

	//turfs += centerturf
	return turfs
	START_PROCESSING(SSradiation, src)
circlular_range
/datum/radiation_wave/Destroy()
	. = QDEL_HINT_IWILLGC
	STOP_PROCESSING(SSradiation, src)
	..()

/datum/radiation_wave/process()
	master_turf = get_step(master_turf, move_dir)
	if(!master_turf)
		qdel(src)
		return
	steps++
	var/list/atoms = get_rad_atoms()

	var/strength
	if(steps>1)
		strength = INVERSE_SQUARE(intensity, max(range_modifier*steps, 1), 1)
	else
		strength = intensity

	if(strength<RAD_BACKGROUND_RADIATION)
		qdel(src)
		return
	radiate(atoms, strength)
	check_obstructions(atoms) // reduce our overall strength if there are radiation insulators

/datum/radiation_wave/proc/get_rad_atoms()
	var/list/atoms = list()
	var/distance = steps
	var/cmove_dir = move_dir
	var/cmaster_turf = master_turf

	if(cmove_dir == NORTH || cmove_dir == SOUTH)
		distance-- //otherwise corners overlap

	atoms += get_rad_contents(cmaster_turf)

	var/turf/place
	for(var/dir in __dirs) //There should be just 2 dirs in here, left and right of the direction of movement
		place = cmaster_turf
		for(var/i in 1 to distance)
			place = get_step(place, dir)
			if(!place)
				break
			atoms += get_rad_contents(place)

	return atoms

/datum/radiation_wave/proc/check_obstructions(list/atoms)
	var/width = steps
	var/cmove_dir = move_dir
	if(cmove_dir == NORTH || cmove_dir == SOUTH)
		width--
	width = 1+(2*width)

	for(var/k in 1 to atoms.len)
		var/atom/thing = atoms[k]
		if(!thing)
			continue
		if (SEND_SIGNAL(thing, COMSIG_ATOM_RAD_WAVE_PASSING, src, width) & COMPONENT_RAD_WAVE_HANDLED)
			continue
		if (thing.rad_insulation != RAD_NO_INSULATION)
			intensity *= (1-((1-thing.rad_insulation)/width))

/datum/radiation_wave/proc/radiate(list/atoms, strength)
	var/can_contam = strength >= RAD_MINIMUM_CONTAMINATION
	var/contamination_strength = (strength-RAD_MINIMUM_CONTAMINATION) * RAD_CONTAMINATION_STR_COEFFICIENT
	contamination_strength = max(contamination_strength, RAD_BACKGROUND_RADIATION)
	// It'll never reach 100% chance but the further out it gets the more likely it'll contaminate
	var/contamination_chance = 100 - (90 / (1 + steps * 0.1))
	for(var/k in atoms)
		var/atom/thing = k
		if(QDELETED(thing))
			continue
		thing.rad_act(strength)

		// This list should only be for types which don't get contaminated but you want to look in their contents
		// If you don't want to look in their contents and you don't want to rad_act them:
		// modify the ignored_things list in __HELPERS/radiation.dm instead
		var/static/list/blacklisted = typecacheof(list(
			/turf,
			/obj/structure/cable,
			/obj/machinery/atmospherics,
			/obj/item/ammo_casing,
			/obj/item/implant,
			/obj/singularity
			))
		if(!can_contaminate || !can_contam || blacklisted[thing.type])
			continue
		if(thing.flags_1 & RAD_NO_CONTAMINATE_1 || SEND_SIGNAL(thing, COMSIG_ATOM_RAD_CONTAMINATING, strength) & COMPONENT_BLOCK_CONTAMINATION)
			continue

		if(contamination_strength > remaining_contam)
			contamination_strength = remaining_contam
		if(!prob(contamination_chance))
			continue
		if(SEND_SIGNAL(thing, COMSIG_ATOM_RAD_CONTAMINATING, strength) & COMPONENT_BLOCK_CONTAMINATION)
			continue
		remaining_contam -= contamination_strength
		if(remaining_contam < RAD_BACKGROUND_RADIATION)
			can_contaminate = FALSE
		thing.AddComponent(/datum/component/radioactive, contamination_strength, source)
