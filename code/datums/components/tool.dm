/**
  *Tool behavior procedure. Redirects to tool-specific procs by default.
  *
  * You can override it to catch all tool interactions, for use in complex deconstruction procs.
  *
  * Must return  parent proc ..() in the end if overridden
  */
/atom/proc/tool_act(mob/living/user, datum/component/tool/I)
	switch(I.tool_behaviour)
		if(TOOL_CROWBAR)
			. |= crowbar_act(user, I)
		if(TOOL_MULTITOOL)
			. |= multitool_act(user, I)
		if(TOOL_SCREWDRIVER)
			. |= screwdriver_act(user, I)
		if(TOOL_WRENCH)
			. |= wrench_act(user, I)
		if(TOOL_WIRECUTTER)
			. |= wirecutter_act(user, I)
		if(TOOL_WELDER)
			. |= welder_act(user, I)
		if(TOOL_ANALYZER)
			. |= analyzer_act(user, I)
	if(. & COMPONENT_BLOCK_TOOL_ATTACK)
		return TRUE

//! Tool-specific behavior procs. They send signals, so try to call ..()
///

///Crowbar act
/atom/proc/crowbar_act(mob/living/user, datum/component/tool/I)
	return SEND_SIGNAL(src, COMSIG_ATOM_CROWBAR_ACT, user, I)

///Multitool act
/atom/proc/multitool_act(mob/living/user, datum/component/tool/I)
	return SEND_SIGNAL(src, COMSIG_ATOM_MULTITOOL_ACT, user, I)

///Check if the multitool has an item in it's data buffer
/atom/proc/multitool_check_buffer(user, obj/item/I, silent = FALSE)
	if(!istype(I, /obj/item/multitool))
		if(user && !silent)
			to_chat(user, "<span class='warning'>[I] has no data buffer!</span>")
		return FALSE
	return TRUE

///Screwdriver act
/atom/proc/screwdriver_act(mob/living/user, datum/component/tool/I)
	return SEND_SIGNAL(src, COMSIG_ATOM_SCREWDRIVER_ACT, user, I)

///Wrench act
/atom/proc/wrench_act(mob/living/user,datum/component/tool/I)
	return SEND_SIGNAL(src, COMSIG_ATOM_WRENCH_ACT, user, I)

///Wirecutter act
/atom/proc/wirecutter_act(mob/living/user, datum/component/tool/I)
	return SEND_SIGNAL(src, COMSIG_ATOM_WIRECUTTER_ACT, user, I)

///Welder act
/atom/proc/welder_act(mob/living/user, datum/component/tool/I)
	return SEND_SIGNAL(src, COMSIG_ATOM_WELDER_ACT, user, I)

///Analyzer act
/atom/proc/analyzer_act(mob/living/user, datum/component/tool/I)
	return SEND_SIGNAL(src, COMSIG_ATOM_ANALYSER_ACT, user, I)


/// Called when a mob tries to use the item as a tool.Handles most checks.
/datum/component/tool/use_tool(atom/target, mob/living/user, delay, amount=0, volume=0, datum/callback/extra_checks)
	// No delay means there is no start message, and no reason to call tool_start_check before use_tool.
	// Run the start check here so we wouldn't have to call it manually.
	if(!delay && !tool_start_check(user, amount))
		return

	var/skill_modifier = 1

	if(tool_behaviour == TOOL_MINING && ishuman(user))
		var/mob/living/carbon/human/H = user
		skill_modifier = H.mind.get_skill_modifier(/datum/skill/mining, SKILL_SPEED_MODIFIER)

		if(H.mind.get_skill_level(/datum/skill/mining) >= SKILL_LEVEL_JOURNEYMAN && prob(H.mind.get_skill_modifier(/datum/skill/mining, SKILL_PROBS_MODIFIER))) // we check if the skill level is greater than Journeyman and then we check for the probality for that specific level.
			mineral_scan_pulse(get_turf(H), SKILL_LEVEL_JOURNEYMAN - 2) //SKILL_LEVEL_JOURNEYMAN = 3 So to get range of 1+ we have to subtract 2 from it,.

	delay *= toolspeed * skill_modifier


	// Play tool sound at the beginning of tool usage.
	play_tool_sound(target, volume)

	if(delay)
		// Create a callback with checks that would be called every tick by do_after.
		var/datum/callback/tool_check = CALLBACK(src, .proc/tool_check_callback, user, amount, extra_checks)

		if(ismob(target))
			if(!do_mob(user, target, delay, extra_checks=tool_check))
				return

		else
			if(!do_after(user, delay, target=target, extra_checks=tool_check))
				return
	else
		// Invoke the extra checks once, just in case.
		if(extra_checks && !extra_checks.Invoke())
			return

	// Use tool's fuel, stack sheets or charges if amount is set.
	if(amount && !use(amount))
		return

	// Play tool sound at the end of tool usage,
	// but only if the delay between the beginning and the end is not too small
	if(delay >= MIN_TOOL_SOUND_DELAY)
		play_tool_sound(target, volume)

	return TRUE

/// Called before [obj/item/proc/use_tool] if there is a delay, or by [obj/item/proc/use_tool] if there isn't. Only ever used by welding tools and stacks, so it's not added on any other [obj/item/proc/use_tool] checks.
/datum/component/tool/tool_start_check(mob/living/user, amount=0)
	return SEND_SIGNAL(src, COMSIG_TOOL_START_USE, user, amount)

/// A check called by [/obj/item/proc/tool_start_check] once, and by use_tool on every tick of delay.
/datum/component/tool/tool_use_check(mob/living/user, amount)
	return !amount


/// Plays item's usesound, if any.
/datum/component/tool/play_tool_sound(atom/target, volume=50)
	if(target && parent.usesound && volume)
		var/played_sound = parent.usesound

		if(islist(played_sound))
			played_sound = pick(played_sound)

		playsound(target, played_sound, volume, TRUE)

/// Used in a callback that is passed by use_tool into do_after call. Do not override, do not call manually.
/datum/component/tool/tool_check_callback(mob/living/user, amount, datum/callback/extra_checks)
	SHOULD_NOT_OVERRIDE(TRUE)
	. = (!extra_checks || extra_checks.Invoke())
	if(.)
		SEND_SIGNAL(src, COMSIG_TOOL_IN_USE, user)


/datum/component/tool
	dupe_mode = COMPONENT_DUPE_UNIQUE_PASSARGS
	///How a tool acts when you use it on something, such as wirecutters cutting wires while multitools measure power
	var/behaviour = NONE
	///How fast does the tool work
	var/speed = 0.7
	var/force_opens = TRUE

/datum/component/tool/Initialize(tool_behaviour, tool_speed, force_opens = FALSE)
	if(!isitem(parent) && !isstructure(parent))
		return COMPONENT_INCOMPATIBLE
	src.behaviour = tool_behaviour
	src.speed = tool_speed
	src.force_opens = force_opens


/datum/component/tool/InheritComponent(datum/component/C, i_am_original, tool_behaviour, tool_speed, force_opens)
	if(!i_am_original)
		return
	if(C)
		var/datum/component/tool/other = C
		src.behaviour = C.tool_behaviour
		src.speed = C.tool_speed
		src.force_opens = C.force_opens
	else
		src.behaviour = tool_behaviour
		src.speed = tool_speed
		src.force_opens = force_opens

/datum/component/tool/RegisterWithParent()
	switch(tool_type)
		RegisterSignal(parent)
	if(ismachinery(parent) || isstructure(parent) || isgun(parent)) // turrets, etc
		RegisterSignal(parent, COMSIG_PROJECTILE_ON_HIT, .proc/projectile_hit)
	else if(isitem(parent))
		RegisterSignal(parent, COMSIG_ITEM_AFTERATTACK, .proc/item_afterattack)
	else if(ishostile(parent))
		RegisterSignal(parent, COMSIG_HOSTILE_ATTACKINGTARGET, .proc/hostile_attackingtarget)

/datum/component/igniter/UnregisterFromParent()
	UnregisterSignal(parent, list(COMSIG_ITEM_AFTERATTACK, COMSIG_HOSTILE_ATTACKINGTARGET, COMSIG_PROJECTILE_ON_HIT))

/datum/component/igniter/proc/item_afterattack(obj/item/source, atom/target, mob/user, proximity_flag, click_parameters)
	if(!proximity_flag)
		return
	do_igniter(target)

/datum/component/igniter/proc/hostile_attackingtarget(mob/living/simple_animal/hostile/attacker, atom/target)
	do_igniter(target)

/datum/component/igniter/proc/projectile_hit(atom/fired_from, atom/movable/firer, atom/target, Angle)
	do_igniter(target)

/datum/component/igniter/proc/do_igniter(atom/target)
	if(isliving(target))
		var/mob/living/L = target
		L.adjust_fire_stacks(fire_stacks)
		L.IgniteMob()
