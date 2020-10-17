/*
Overview:
   Used to create objects that need a per step proc call.  Default definition of 'Initialize()'
   stores a reference to src machine in global 'machines list'.  Default definition
   of 'Destroy' removes reference to src machine in global 'machines list'.

Class Variables:
   use_power (num)
      current state of auto power use.
      Possible Values:
		NO_POWER_USE -- no auto power use
		IDLE_POWER_USE -- machine is using power at its idle power level
		ACTIVE_POWER_USE -- machine is using power at its active power level

   active_power_usage (num)
      Value for the amount of power to use when in active power mode

   idle_power_usage (num)
      Value for the amount of power to use when in idle power mode

   power_channel (num)
      What channel to draw from when drawing power for power mode
      Possible Values:
		AREA_USAGE_EQUIP:0 -- Equipment Channel
		AREA_USAGE_LIGHT:2 -- Lighting Channel
		AREA_USAGE_ENVIRON:3 -- Environment Channel

   component_parts (list)
      A list of component parts of machine used by frame based machines.

   machine_stat (bitflag)
      Machine status bit flags.
      Possible bit flags:
		MACHINE_STAT_BROKEN -- Machine is broken
		MACHINE_STAT_NOPOWER -- No power is being supplied to machine.
		MACHINE_STAT_MAINT -- machine is currently under going maintenance.
		MACHINE_STAT_EMPED -- temporary broken by EMP pulse
		MACHINE_STAT_OFF	-- switched off manualy

Class Procs:
   Initialize()                     'game/machinery/machine.dm'

   Destroy()                   'game/machinery/machine.dm'

   auto_use_power()            'game/machinery/machine.dm'
      This proc determines how power mode power is deducted by the machine.
      'auto_use_power()' is called by the 'master_controller' game_controller every
      tick.

      Return Value:
         return:1 -- if object is powered
         return:0 -- if object is not powered.

      Default definition uses 'use_power', 'power_channel', 'active_power_usage',
      'idle_power_usage', 'powered()', and 'use_power()' implement behavior.

   powered(chan = -1)         'modules/power/power.dm'
      Checks to see if area that contains the object has power available for power
      channel given in 'chan'. -1 defaults to power_channel

   use_power(amount, chan=-1)   'modules/power/power.dm'
      Deducts 'amount' from the power channel 'chan' of the area that contains the object.

   power_change()               'modules/power/power.dm'
      Called by the area that contains the object when ever that area under goes a
      power state change (area runs out of power, or area channel is turned off).

   RefreshParts()               'game/machinery/machine.dm'
      Called to refresh the variables in the machine that are contributed to by parts
      contained in the component_parts list. (example: glass and material amounts for
      the autolathe)

      Default definition does nothing.

   process()                  'game/machinery/machine.dm'
      Called by the 'machinery subsystem' once per machinery tick for each machine that is listed in its 'machines' list.

   process_atmos()
      Called by the 'air subsystem' once per atmos tick for each machine that is listed in its 'atmos_machines' list.

	Compiled by Aygar
*/

/obj/machinery
	name = "machinery"
	icon = 'icons/obj/stationobjs.dmi'
	desc = "Some kind of machine."
	verb_say = "beeps"
	verb_yell = "blares"
	pressure_resistance = 15
	max_integrity = 200
	layer = BELOW_OBJ_LAYER //keeps shit coming out of the machine from ending up underneath it.
	flags_ricochet = RICOCHET_HARD
	receive_ricochet_chance_mod = 0.3

	anchored = TRUE
	interaction_flags_atom = INTERACT_ATOM_ATTACK_HAND | INTERACT_ATOM_UI_INTERACT

	var/machine_stat = NONE
	var/idle_power_usage = 0
	var/active_power_usage = 0
	var/cell_charging_power_usage = 10 	// extra power used to charge the batterys
	var/power_channel = AREA_USAGE_EQUIP //AREA_USAGE_EQUIP,AREA_USAGE_ENVIRON or AREA_USAGE_LIGHT
	var/machine_setting = MACHINE_SETTING_USE_APC
	var/chargeEfficiency = 1
	var/datum/powernet/powernet = null // where we got power from, APC or wire
	var/machinery_layer = MACHINERY_LAYER_1 | MACHINERY_LAYER_2 | MACHINERY_LAYER_3 // search for any wire layer
	var/obj/item/stock_parts/cell/cell = null 		// If we use a battery its put here.  If you want to use a bunch of cells use /obj/item/stock_parts/cell/series
	var/list/component_parts = null //list of all the parts used to build it, if made from certain kinds of frames.

	var/panel_open = FALSE
	var/state_open = FALSE
	var/critical_machine = FALSE //If this machine is critical to station operation and should have the area be excempted from power failures.
	var/list/occupant_typecache //if set, turned into typecache in Initialize, other wise, defaults to mob/living typecache
	var/atom/movable/occupant = null
	var/frame_type =  /obj/structure/frame/machine
	/// Viable flags to go here are START_PROCESSING_ON_INIT, or START_PROCESSING_MANUALLY. See code\__DEFINES\machines.dm for more information on these flags.
	var/processing_flags = START_PROCESSING_ON_INIT
	/// What subsystem this machine will use, which is generally SSmachines or SSfastprocess. By default all machinery use SSmachines. This fires a machine's process() roughly every 2 seconds.
	var/subsystem_type = /datum/controller/subsystem/machines
	var/obj/item/circuitboard/machine/circuit // Circuit to be created and inserted when the machinery is created

	var/interaction_flags_machine = INTERACT_MACHINE_WIRES_IF_OPEN | INTERACT_MACHINE_ALLOW_SILICON | INTERACT_MACHINE_OPEN_SILICON | INTERACT_MACHINE_SET_MACHINE
	var/fair_market_price = 69
	var/market_verb = "Customer"
	var/payment_department = ACCOUNT_ENG

	// For storing and overriding ui id
	var/tgui_id // ID of TGUI interface

	// Moved id_tag and radio here.  Its in nearly 50% of the machines anyway and is just so much copypasta
	var/id_tag = null
	var/frequency = null
	var/frequency_filter = null // filter for the radio connection
	var/datum/radio_frequency/radio_connection


/// Radio interface
/obj/machinery/proc/set_frequency(new_frequency)
	SSradio.remove_object(src, frequency)
	if(new_frequency)
		frequency = new_frequency
		radio_connection = SSradio.add_object(src, frequency, frequency_filter)


/obj/machinery/get_cell()
	return cell

/obj/machinery/Initialize()
	if(!armor)
		armor = list(MELEE = 25, BULLET = 10, LASER = 10, ENERGY = 0, BOMB = 0, BIO = 0, RAD = 0, FIRE = 50, ACID = 70)
	. = ..()
	GLOB.machines += src

	if(ispath(circuit, /obj/item/circuitboard))
		circuit = new circuit(src)
		circuit.apply_default_parts(src)
	else // sanity check, if we never had a board, we do not have anything else
		machine_setting |= MACHINE_SETTING_NO_CIRCUIT

	if(processing_flags & START_PROCESSING_ON_INIT)
		begin_processing()

	if(occupant_typecache)
		occupant_typecache = typecacheof(occupant_typecache)

	if(frequency)
		set_frequency(frequency)

	return INITIALIZE_HINT_LATELOAD

/// Helper proc for telling a machine to start processing with the subsystem type that is located in its `subsystem_type` var.
/obj/machinery/proc/begin_processing()
	var/datum/controller/subsystem/processing/subsystem = locate(subsystem_type) in Master.subsystems
	START_PROCESSING(subsystem, src)

/// Helper proc for telling a machine to stop processing with the subsystem type that is located in its `subsystem_type` var.
/obj/machinery/proc/end_processing()
	var/datum/controller/subsystem/processing/subsystem = locate(subsystem_type) in Master.subsystems
	STOP_PROCESSING(subsystem, src)

/obj/machinery/LateInitialize()
	. = ..()
	power_change()
	RegisterSignal(src, COMSIG_ENTER_AREA, .proc/power_change)
	RegisterSignal(src, COMSIG_MOVABLE_SET_ANCHORED, .proc/power_change)
/obj/machinery/Destroy()
	GLOB.machines.Remove(src)
	end_processing()
	if(frequency)
		SSradio.remove_object(src,frequency)
	dump_contents()
	QDEL_LIST(component_parts)
	QDEL_NULL(circuit)
	return ..()


/obj/machinery/proc/power_change()
	// clear the powernet and search again
	if(powernet)
		machines_on_power.Remove(src)
		powernet = null

	// First we check if wired, if so we don't use the APC powernet
	if(anchored && MACHINE_SETTING_ISSET(MACHINE_SETTING_WIRE))
		var/turf/T = loc
		if(T)
			var/obj/structure/cable/C = T.get_cable_node(machinery_layer)
			if(C?.powernet) // make sure we have a power net
				powernet = C.powernet
				machines_on_power[src] = powernet
				RegesterSignal(C, COMSIG_PARENT_QDELETING, ./proc/power_change)

	if(MACHINE_SETTING_ISSET(MACHINE_SETTING_APC))
		var/area/A = get_area(src)		// make sure it's in an area

		if(A) // we use area power then
			A.get_
			A.use_power(amount, chan)
			if(cell && MACHINE_SETTING_ISSET(MACHINE_SETTING_CHARGE_CELL))
				var/excess = _charge_cell(cell_charging_power_usage)
				excess = cell_charging_power_usage - excess
				if(excess > 0) // if we can charge then use the power
					A.use_power(excess, chan)
			return

	if(MACHINE_SETTING_ISSET(MACHINE_SETTING_CELL))
		var/excess = _use_cell(amount)


powernet
/obj/machinery/proc/locate_machinery()
	return

/obj/machinery/process()//If you dont use process or power why are you here
	return PROCESS_KILL

/obj/machinery/proc/process_atmos()//If you dont use process why are you here
	return PROCESS_KILL


/// Call this instead of setting machine_stat as this will cycle though all the
/// signals to set.
/// It also handles signals that need to be sent (powerchange, broken, etc)
/obj/machinery/proc/machine_stat_change(new_value)
	if(new_value == machine_stat)
		return
	var/old_value = machine_stat // running conditions...live with it
	machine_stat = new_value
	update_icon() // update the icon because the machine state has changed...humm, should we make panel a bitflag
	// If this signal is handled then we can ignore the other signals being sent
	if(SEND_SIGNAL(src, COMSIG_MACHINERY_MACHINE_STAT_CHANGE, old_value, new_value))
		return // if we return
	if(!MACHINE_USES_POWER(src)) // if we don't use power, ignore the power signals
		return
	// if power changed, then send that signal
	if((old_value & MACHINE_STAT_OFF) != (machine_stat & MACHINE_STAT_OFF) || (old_value & MACHINE_STAT_NOPOWER) != (machine_stat & MACHINE_STAT_NOPOWER))
		if((machine_stat & MACHINE_STAT_OFF) || (machine_stat & MACHINE_STAT_NOPOWER))
			SEND_SIGNAL(src, COMSIG_MACHINERY_POWER_LOST)
		else
			SEND_SIGNAL(src, COMSIG_MACHINERY_POWER_RESTORED)

	if(on && MACHINE_STAT_ISSET(MACHINE_STAT_OFF))
		if(!MACHINE_STAT_ISSET(MACHINE_STAT_NOPOWER))
			SEND_SIGNAL(src, COMSIG_MACHINERY_POWER_RESTORED)
		set_machine_stat(machine_stat & ~MACHINE_STAT_OFF)
		. = TRUE
	else if(!on && !MACHINE_STAT_ISSET(MACHINE_STAT_OFF))
		SEND_SIGNAL(src, COMSIG_MACHINERY_POWER_LOST)
		set_machine_stat(machine_stat | MACHINE_STAT_OFF)
		. = TRUE
	if(.)
		MACHINE_USES_POWER
// NOTE: Should I change below to be defines?





/obj/machinery/emp_act(severity)
	. = ..()
	if(use_power && !machine_stat && !(. & EMP_PROTECT_SELF))
		use_power(7500/severity)
		new /obj/effect/temp_visual/emp(loc)

/**
  * Opens the machine.
  *
  * Will update the machine icon and any user interfaces currently open.
  * Arguments:
  * * drop - Boolean. Whether to drop any stored items in the machine. Does not include components.
  */
/obj/machinery/proc/open_machine(drop = TRUE)
	state_open = TRUE
	density = FALSE
	if(drop)
		_dump_inventory(MACHINE_DROP_CONTENTS)
	update_icon()
	updateUsrDialog()


// -- START INVENTORY CODE
// All the code below handles the inventory removal and replacement of component parts, occupants etc..
// Generally, everything in component_parts are in nullspace.  They are a PART of the machine.  Everything else
// should go into the standard components list.  We do it like this so if we need to dump out the machine,
// aka, empty a washer, chem etc, we don't have to exempt the machine parts.  Or if it blows up, again, we
// can just dump the contents and have the rest of the parts vaporize with the machine.  One exception is the
// circuit, while also in nullspace, is only refereed in the circuit var.  If it doesn't exist, we don't use
// component_parts at all and some machines are not allowed to drop it but allowed to drop component_parts
// (see sleepers and various admin machines)


/// Does a complete qdel of everything except contents without checking flags or settings
/obj/machinery/proc/_delete_inventory()
	if(contents.len > 0) // make sure its moved to nullspace to skip handle_atom_del call
		var/atom/movable/A
		for(var/i in 1 to contents.len)
			A = contents[i]
			A.moveToNullspace()
			qdel(A)
		contents.Cut()
	QDEL_LIST(component_parts)
	QDEL_NULL(circuit)
	occupant = null
	cell = null

/// The handle "all in one" code for dumping the inventory of a machine
/obj/machinery/proc/_dump_inventory(machine_dump_mask, disassembled=TRUE)
	var/turf/this_turf = get_turf(src)
	machine_dump_mask &= machine_settings // settings overrides whatever you put in dump mask

	// Handle contents
	if(contents.len > 0 && !(machine_dump_mask & MACHINE_SETTING_NO_DROP_CONTENTS))
		var/mob/living/living_mob
		var/atom/movable/movable_atom
		for(var/i in 1 to contents.len)
			movable_atom = contents[i]
			if(occupant == movable_atom)
				// Handle occupant
				if(occupant && !(machine_dump_mask & MACHINE_SETTING_NO_DROP_OCCUPANT))
					occupant = null
				else
					continue // we skip it
			movable_atom.forceMove(this_turf)
			living_mob = movable_atom
			if(living_mob)
				living_mob.update_mobility()

	// handle frame
	if(frame_type && ispath(frame_type) && !(machine_dump_mask & MACHINE_SETTING_NO_DROP_FRAME))
		var/frame_type/frame = new.frame_type(this_turf)
		if(!disassembled || MACHINE_IS_BROKEN(src))
			frame.obj_integrity = frame.max_integrity * 0.5 //the frame is already half broken
		transfer_fingerprints_to(frame)
		frame.state = 2
		frame.icon_state = "box_1"
		frame.set_anchored(anchored)
		frame.setDir(dir)


	// Handle Components
	if(component_parts.len > 0 && !(machine_dump_mask & MACHINE_SETTING_NO_DROP_COMPONENTS))
		for(var/obj/O in component_parts) // if this runtimes, its your own damn fault
			if(istype(O, /obj/item/stack))
				var/obj/item/stack/S = O // stack off stuff.
				// wish glass was a subclass
				if(is_glass_sheet(S) && (!disassembled || MACHINE_IS_BROKEN(src)))
					var/shared_type = istype(S, /obj/item/sheet/plasmaglass) ? /obj/item/shard/plasma : /obj/item/shard
					for(var/i in 1 to S.get_amount())
						new shard_type(this_turf)
					qdel(O)
					continue
			O.forceMove(this_turf) // just it to the floor
			O.update_icon()
		component_parts.Cut()
		cell = null	// clear cell references

	// Handle circuit
	if(circuit && !(machine_dump_mask & MACHINE_SETTING_NO_DROP_CIRCUIT))
		circuit.forceMove(this_turf)
		circuit = null

	// handle frame
/obj/machinery/dump_contents()
	_dump_inventory(MACHINE_DROP_CONTENTS) // dump everything that is put in the machine
	return ..()

// this will be the main function for all of machinery.  The goal is that you never
// have to override this function as it handles even weird use cases
// Except for computers, we shouldn't ever need override this as either items
// will be in contents or parts be in component_parts
/obj/machinery/deconstruct(disassembled = TRUE)
	if(!(flags_1 & NODECONSTRUCT_1))
		// Handle Components
		_dump_inventory(MACHINE_DUMP_ALL, disassembled)
		_delete_inventory()

	return ..()


/obj/machinery/handle_atom_del(atom/A)
	if(A == occupant)
		occupant = null
		update_icon()
		updateUsrDialog()
		return ..()

	if(A == circuit)
		circuit = null
		return ..()

	if((A in component_parts) && !QDELETED(src))
		component_parts.Remove(A)
		// It would be unusual for a component_part to be qdel'd ordinarily.
		log_runtime("Machine '[src]' handle_atom_del part '[A]' so there is a logic problem")
		//deconstruct(FALSE)
	// if its in contents its moved to nullspace anyway

	return ..()

// -- END INVENTORY CODE


/**
 * Puts passed object in to user's hand
 *
 * Puts the passed object in to the users hand if they are adjacent.
 * If the user is not adjacent then place the object on top of the machine.
 *
 * Vars:
 * * object (obj) The object to be moved in to the users hand.
 * * user (mob/living) The user to recive the object
 */
/obj/machinery/proc/try_put_in_hand(obj/object, mob/living/user)
	if(!issilicon(user) && in_range(src, user))
		user.put_in_hands(object)
	else
		object.forceMove(drop_location())

/obj/machinery/proc/can_be_occupant(atom/movable/am)
	return occupant_typecache ? is_type_in_typecache(am, occupant_typecache) : isliving(am)

/obj/machinery/proc/close_machine(atom/movable/target = null)
	state_open = FALSE
	density = TRUE
	if(!target)
		for(var/am in loc)
			if (!(can_be_occupant(am)))
				continue
			var/atom/movable/AM = am
			if(AM.has_buckled_mobs())
				continue
			if(isliving(AM))
				var/mob/living/L = am
				if(L.buckled || L.mob_size >= MOB_SIZE_LARGE)
					continue
			target = am

	var/mob/living/mobtarget = target
	if(target && !target.has_buckled_mobs() && (!isliving(target) || !mobtarget.buckled))
		occupant = target
		target.forceMove(src)
	updateUsrDialog()
	update_icon()

// moved from power.dm...why it was there no one knows

// returns true if the area has power on given channel (or doesn't require power).
// defaults to power_channel
/obj/machinery/proc/powered(chan = -1) // defaults to power_channel
	if(!loc)
		return FALSE // we are in null space
	if(!MACHINE_USES_POWER(src))
		return TRUE
	// TODO: move power use of wire from power to here and
	// make power devices devices that send power?  Or just put them
	// all in machines humm
	//if(MACHINE_SETTING_ISSET(MACHINE_SETTING_WIRE))

	if(MACHINE_SETTING_ISSET(MACHINE_SETTING_APC))
		var/area/A = get_area(src)		// make sure it's in an area
		if(A)
			if(chan == -1)
				chan = power_channel
			if(A.powered(chan))	// return power status of the area
				return TRUE

	if(MACHINE_SETTING_ISSET(MACHINE_SETTING_CELL))
		if(cell)
			return _cell_total_charge() > active_power_usage // we just check if we got battery's, NOT if they are charged


// increment the power usage stats for an area
/obj/machinery/proc/use_power(amount, chan = -1) // defaults to power_channel
	if(MACHINE_SETTING_ISSET(MACHINE_SETTING_APC))
		var/area/A = get_area(src)		// make sure it's in an area
		if(chan == -1)
			chan = power_channel
		if(A && A.powered(chan)) // we use area power then
			A.use_power(amount, chan)
			if(cell && MACHINE_SETTING_ISSET(MACHINE_SETTING_CHARGE_CELL))
				var/excess = _charge_cell(cell_charging_power_usage)
				excess = cell_charging_power_usage - excess
				if(excess > 0) // if we can charge then use the power
					A.use_power(excess, chan)
			return

	if(MACHINE_SETTING_ISSET(MACHINE_SETTING_CELL))
		var/excess = _use_cell(amount)


	return PROCESS_KILL // no power
			SEND_SIGNAL(src, COMSIG_MACHINERY_POWER_LOST)
			. = TRUE
		set_machine_stat(machine_stat | MACHINE_STAT_NOPOWER)



/obj/machinery/proc/auto_use_power()
	if(!MACHINE_USES_POWER(src))
		return PROCESS_KILL // remove from process, don't check power use

	if(MACHINE_SETTING_ISSET(MACHINE_SETTING_APC))
		var/area/A = get_area(src)		// make sure it's in an area
		if(chan == -1)
			chan = power_channel
		if(A && A.powered(chan)) // we use area power then
			A.use_power(amount, chan)
			if(cell && MACHINE_SETTING_ISSET(MACHINE_SETTING_CHARGE_CELL))
				var/excess = _charge_cell(cell_charging_power_usage)
				excess = cell_charging_power_usage - excess
				if(excess > 0) // if we can charge then use the power
					A.use_power(excess, chan)
			return

	if(MACHINE_SETTING_ISSET(MACHINE_SETTING_CELL))
		var/excess = _use_cell(amount)

	if(!powered(power_channel))
		return PROCESS_KILL
	if(use_power == 1)
		use_power(idle_power_usage,power_channel)
	else if(use_power >= 2)
		use_power(active_power_usage,power_channel)
	return TRUE


/obj/machinery/can_interact(mob/user)
	if((machine_stat & (MACHINE_STAT_NOPOWER|MACHINE_STAT_BROKEN)) && !(interaction_flags_machine & INTERACT_MACHINE_OFFLINE)) // Check if the machine is broken, and if we can still interact with it if so
		return FALSE

	var/silicon = issilicon(user)
	if(panel_open && !(interaction_flags_machine & INTERACT_MACHINE_OPEN)) // Check if we can interact with an open panel machine, if the panel is open
		if(!silicon || !(interaction_flags_machine & INTERACT_MACHINE_OPEN_SILICON))
			return FALSE

	if(silicon || isAdminGhostAI(user)) // If we are an AI or adminghsot, make sure the machine allows silicons to interact
		if(!(interaction_flags_machine & INTERACT_MACHINE_ALLOW_SILICON))
			return FALSE

	else if(isliving(user)) // If we are a living human
		var/mob/living/L = user

		if(interaction_flags_machine & INTERACT_MACHINE_REQUIRES_SILICON) // First make sure the machine doesn't require silicon interaction
			return FALSE

		if(interaction_flags_machine & INTERACT_MACHINE_REQUIRES_SIGHT)
			if(user.is_blind())
				to_chat(user, "<span class='warning'>This machine requires sight to use.</span>")
				return FALSE

		if(!Adjacent(user)) // Next make sure we are next to the machine unless we have telekinesis
			var/mob/living/carbon/H = L
			if(!(istype(H) && H.has_dna() && H.dna.check_mutation(TK)))
				return FALSE

		if(L.incapacitated()) // Finally make sure we aren't incapacitated
			return FALSE

	else // If we aren't a silicon, living, or admin ghost, bad!
		return FALSE

	return TRUE // If we pass all these checks, woohoo! We can interact

/obj/machinery/proc/check_nap_violations()
	if(!SSeconomy.full_ancap)
		return TRUE
	if(occupant && !state_open)
		if(ishuman(occupant))
			var/mob/living/carbon/human/H = occupant
			var/obj/item/card/id/I = H.get_idcard(TRUE)
			if(I)
				var/datum/bank_account/insurance = I.registered_account
				if(!insurance)
					say("[market_verb] NAP Violation: No bank account found.")
					nap_violation(occupant)
					return FALSE
				else
					if(!insurance.adjust_money(-fair_market_price))
						say("[market_verb] NAP Violation: Unable to pay.")
						nap_violation(occupant)
						return FALSE
					var/datum/bank_account/D = SSeconomy.get_dep_account(payment_department)
					if(D)
						D.adjust_money(fair_market_price)
			else
				say("[market_verb] NAP Violation: No ID card found.")
				nap_violation(occupant)
				return FALSE
	return TRUE

/obj/machinery/proc/nap_violation(mob/violator)
	return

////////////////////////////////////////////////////////////////////////////////////////////

//Return a non FALSE value to interrupt attack_hand propagation to subtypes.
/obj/machinery/interact(mob/user, special_state)
	if(interaction_flags_machine & INTERACT_MACHINE_SET_MACHINE)
		user.set_machine(src)
	. = ..()

/obj/machinery/ui_act(action, list/params)
	add_fingerprint(usr)
	return ..()

/obj/machinery/Topic(href, href_list)
	..()
	if(!can_interact(usr))
		return TRUE
	if(!usr.canUseTopic(src))
		return TRUE
	add_fingerprint(usr)
	return FALSE

////////////////////////////////////////////////////////////////////////////////////////////

/obj/machinery/attack_paw(mob/living/user)
	if(user.a_intent != INTENT_HARM)
		return attack_hand(user)
	else
		user.changeNext_move(CLICK_CD_MELEE)
		user.do_attack_animation(src, ATTACK_EFFECT_PUNCH)
		user.visible_message("<span class='danger'>[user.name] smashes against \the [src.name] with its paws.</span>", null, null, COMBAT_MESSAGE_RANGE)
		take_damage(4, BRUTE, MELEE, 1)

/obj/machinery/attack_hulk(mob/living/carbon/user)
	. = ..()
	var/obj/item/bodypart/arm = user.hand_bodyparts[user.active_hand_index]
	if(!arm)
		return
	if(arm.bodypart_disabled)
		return
	var/damage = damage_deflection / 10
	arm.receive_damage(brute=damage, wound_bonus = CANT_WOUND)

/obj/machinery/attack_robot(mob/user)
	if(!(interaction_flags_machine & INTERACT_MACHINE_ALLOW_SILICON) && !isAdminGhostAI(user))
		return FALSE
	if(Adjacent(user) && can_buckle && has_buckled_mobs()) //so that borgs (but not AIs, sadly (perhaps in a future PR?)) can unbuckle people from machines
		if(buckled_mobs.len > 1)
			var/unbuckled = input(user, "Who do you wish to unbuckle?","Unbuckle Who?") as null|mob in sortNames(buckled_mobs)
			if(user_unbuckle_mob(unbuckled,user))
				return TRUE
		else
			if(user_unbuckle_mob(buckled_mobs[1],user))
				return TRUE
	return _try_interact(user)

/obj/machinery/attack_ai(mob/user)
	if(!(interaction_flags_machine & INTERACT_MACHINE_ALLOW_SILICON) && !isAdminGhostAI(user))
		return FALSE
	if(iscyborg(user))// For some reason attack_robot doesn't work
		return attack_robot(user)
	else
		return _try_interact(user)

/obj/machinery/_try_interact(mob/user)
	if((interaction_flags_machine & INTERACT_MACHINE_WIRES_IF_OPEN) && panel_open && (attempt_wire_interaction(user) == WIRE_INTERACTION_BLOCK))
		return TRUE
	return ..()

// never use this for machines.  We don't use it anyway... why not though?
// This is another rabbit hole I am not going down and not relevant for machines
/obj/machinery/CheckParts(list/parts_list)
	ASSERT(1)
	log_runtime("CheckParts run on '[src]' machine.  Shouldn't run it on this?")

///
/obj/machinery/proc/RefreshParts() //Placeholder proc for machines that are built using frames.
	SHOULD_CALL_PARENT(1)
	// sanity check here, check if we have any cells or boards and move them to the right vars
	// clear cells
	cell = null
	for(var/thing in component_parts)
		if(istype(thing, /obj/item/circuitboard))
			log_runtime("There is a '[src]' in component_parts, don't put circuit in component_parts")
			component_parts.Remove(thing) // don't be in here
		if(istype(thing, /obj/item/stock_parts/cell))
			// assign internal cells
			if(!cell)
				cell = thing
			else
				log_runtime("There is more than one '[src]' in component_parts, don't put more than one cell's in component_parts.  If your using more than one use cell/series")
				component_parts.Remove(thing)

	update_power() // in case we have new cells in here

/obj/machinery/proc/default_pry_open(obj/item/I)
	. = !(state_open || panel_open || MACHINE_IS_OPERATIONAL(src) || (flags_1 & NODECONSTRUCT_1)) && I.tool_behaviour == TOOL_CROWBAR
	if(.)
		I.play_tool_sound(src, 50)
		visible_message("<span class='notice'>[usr] pries open \the [src].</span>", "<span class='notice'>You pry open \the [src].</span>")
		open_machine()

/obj/machinery/proc/default_deconstruction_crowbar(obj/item/I, ignore_panel = 0)
	. = (panel_open || ignore_panel) && !(flags_1 & NODECONSTRUCT_1) && I.tool_behaviour == TOOL_CROWBAR
	if(.)
		I.play_tool_sound(src, 50)
		deconstruct(TRUE)



/obj/machinery/obj_break(damage_flag)
	SHOULD_CALL_PARENT(TRUE)
	. = ..()
	if(!(machine_stat & MACHINE_STAT_BROKEN) && !(flags_1 & NODECONSTRUCT_1))
		set_machine_stat(machine_stat | MACHINE_STAT_BROKEN)
		SEND_SIGNAL(src, COMSIG_MACHINERY_BROKEN, damage_flag)
		update_icon()
		return TRUE

/obj/machinery/contents_explosion(severity, target)
	if(occupant)
		occupant.ex_act(severity, target)



/obj/machinery/CanAllowThrough(atom/movable/mover, turf/target)
	. = ..()
	if(mover.pass_flags & PASSMACHINE)
		return TRUE

/obj/machinery/proc/default_deconstruction_screwdriver(mob/user, icon_state_open, icon_state_closed, obj/item/I)
	if(!(flags_1 & NODECONSTRUCT_1) && I.tool_behaviour == TOOL_SCREWDRIVER)
		I.play_tool_sound(src, 50)
		if(!panel_open)
			panel_open = TRUE
			icon_state = icon_state_open
			to_chat(user, "<span class='notice'>You open the maintenance hatch of [src].</span>")
		else
			panel_open = FALSE
			icon_state = icon_state_closed
			to_chat(user, "<span class='notice'>You close the maintenance hatch of [src].</span>")
		return TRUE
	return FALSE

/obj/machinery/proc/default_change_direction_wrench(mob/user, obj/item/I)
	if(panel_open && I.tool_behaviour == TOOL_WRENCH)
		I.play_tool_sound(src, 50)
		setDir(turn(dir,-90))
		to_chat(user, "<span class='notice'>You rotate [src].</span>")
		return TRUE
	return FALSE

/obj/proc/can_be_unfasten_wrench(mob/user, silent) //if we can unwrench this object; returns SUCCESSFUL_UNFASTEN and FAILED_UNFASTEN, which are both TRUE, or CANT_UNFASTEN, which isn't.
	if(!(isfloorturf(loc) || istype(loc, /turf/open/indestructible)) && !anchored)
		to_chat(user, "<span class='warning'>[src] needs to be on the floor to be secured!</span>")
		return FAILED_UNFASTEN
	return SUCCESSFUL_UNFASTEN

/obj/proc/default_unfasten_wrench(mob/user, obj/item/I, time = 20) //try to unwrench an object in a WONDERFUL DYNAMIC WAY
	if(!(flags_1 & NODECONSTRUCT_1) && I.tool_behaviour == TOOL_WRENCH)
		var/can_be_unfasten = can_be_unfasten_wrench(user)
		if(!can_be_unfasten || can_be_unfasten == FAILED_UNFASTEN)
			return can_be_unfasten
		if(time)
			to_chat(user, "<span class='notice'>You begin [anchored ? "un" : ""]securing [src]...</span>")
		I.play_tool_sound(src, 50)
		var/prev_anchored = anchored
		//as long as we're the same anchored state and we're either on a floor or are anchored, toggle our anchored state
		if(I.use_tool(src, user, time, extra_checks = CALLBACK(src, .proc/unfasten_wrench_check, prev_anchored, user)))
			to_chat(user, "<span class='notice'>You [anchored ? "un" : ""]secure [src].</span>")
			set_anchored(!anchored)
			playsound(src, 'sound/items/deconstruct.ogg', 50, TRUE)
			SEND_SIGNAL(src, COMSIG_OBJ_DEFAULT_UNFASTEN_WRENCH, anchored)
			return SUCCESSFUL_UNFASTEN
		return FAILED_UNFASTEN
	return CANT_UNFASTEN

/obj/proc/unfasten_wrench_check(prev_anchored, mob/user) //for the do_after, this checks if unfastening conditions are still valid
	if(anchored != prev_anchored)
		return FALSE
	if(can_be_unfasten_wrench(user, TRUE) != SUCCESSFUL_UNFASTEN) //if we aren't explicitly successful, cancel the fuck out
		return FALSE

/// Allows you to replace one part at a time, like a battery cell or just upgrading something by hand
/obj/machinery/proc/exchange_part(mob/user, obj/item/P)
	if((flags_1 & NODECONSTRUCT_1) && !W.works_from_distance)
		return FALSE
	var/shouldplaysound = 0
	if(component_parts)
		if(panel_open)
			var/obj/item/circuitboard/machine/CB = circuit
			to_chat(user, display_parts(user))
			var/P
			for(var/obj/item/A in component_parts)
				for(var/D in CB.req_components)
					if(ispath(A.type, D))
						P = D
						break
					if(istype(B, P) && istype(A, P))
						if(B.get_part_rating() > A.get_part_rating())
							if(istype(B,/obj/item/stack)) //conveniently this will mean A is also a stack and I will kill the first person to prove me wrong
								var/obj/item/stack/SA = A
								var/obj/item/stack/SB = B
								var/used_amt = SA.get_amount()
								if(!SB.use(used_amt))
									continue //if we don't have the exact amount to replace we don't
								var/obj/item/stack/SN = new SB.merge_type(null,used_amt)
								component_parts += SN
							else
								if(SEND_SIGNAL(W, COMSIG_TRY_STORAGE_TAKE, B, src))
									component_parts += B
									B.moveToNullSpace()
							SEND_SIGNAL(W, COMSIG_TRY_STORAGE_INSERT, A, null, null, TRUE)
							component_parts -= A
							to_chat(user, "<span class='notice'>[capitalize(A.name)] replaced with [B.name].</span>")
							shouldplaysound = 1 //Only play the sound when parts are actually replaced!
							break

/obj/machinery/proc/exchange_parts(mob/user, obj/item/storage/part_replacer/W)
	if(!istype(W))
		return FALSE
	if((flags_1 & NODECONSTRUCT_1) && !W.works_from_distance)
		return FALSE
	var/shouldplaysound = 0
	if(component_parts)
		if(panel_open || W.works_from_distance)
			var/obj/item/circuitboard/machine/CB = circuit
			var/P
			if(W.works_from_distance)
				to_chat(user, display_parts(user))
			for(var/obj/item/A in component_parts)
				for(var/D in CB.req_components)
					if(ispath(A.type, D))
						P = D
						break
				for(var/obj/item/B in W.contents)
					if(istype(B, P) && istype(A, P))
						if(B.get_part_rating() > A.get_part_rating())
							if(istype(B,/obj/item/stack)) //conveniently this will mean A is also a stack and I will kill the first person to prove me wrong
								var/obj/item/stack/SA = A
								var/obj/item/stack/SB = B
								var/used_amt = SA.get_amount()
								if(!SB.use(used_amt))
									continue //if we don't have the exact amount to replace we don't
								var/obj/item/stack/SN = new SB.merge_type(null,used_amt)
								component_parts += SN
							else
								if(SEND_SIGNAL(W, COMSIG_TRY_STORAGE_TAKE, B, src))
									component_parts += B
									B.moveToNullSpace()
							SEND_SIGNAL(W, COMSIG_TRY_STORAGE_INSERT, A, null, null, TRUE)
							component_parts -= A
							to_chat(user, "<span class='notice'>[capitalize(A.name)] replaced with [B.name].</span>")
							shouldplaysound = 1 //Only play the sound when parts are actually replaced!
							break
			RefreshParts()
		else
			to_chat(user, display_parts(user))
		if(shouldplaysound)
			W.play_rped_sound()
		return TRUE
	return FALSE

/obj/machinery/proc/display_parts(mob/user)
	. = list()
	. += "<span class='notice'>It contains the following parts:</span>"
	for(var/obj/item/C in component_parts)
		. += "<span class='notice'>[icon2html(C, user)] \A [C].</span>"
	. = jointext(., "")

/obj/machinery/examine(mob/user)
	. = ..()
	if(machine_stat & MACHINE_STAT_BROKEN)
		. += "<span class='notice'>It looks broken and non-functional.</span>"
	if(!(resistance_flags & INDESTRUCTIBLE))
		if(resistance_flags & ON_FIRE)
			. += "<span class='warning'>It's on fire!</span>"
		var/healthpercent = (obj_integrity/max_integrity) * 100
		switch(healthpercent)
			if(50 to 99)
				. += "It looks slightly damaged."
			if(25 to 50)
				. += "It appears heavily damaged."
			if(0 to 25)
				. += "<span class='warning'>It's falling apart!</span>"
	if(user.research_scanner && component_parts)
		. += display_parts(user, TRUE)

//called on machinery construction (i.e from frame to machinery) but not on initialization
#if 0
/obj/machinery/proc/on_construction()
	return

//called on deconstruction before the final deletion
/obj/machinery/proc/on_deconstruction()
	return

/obj/machinery/proc/can_be_overridden()
	. = 1
#endif

/obj/machinery/zap_act(power, zap_flags)
	if(prob(85) && (zap_flags & ZAP_MACHINE_EXPLOSIVE) && !(resistance_flags & INDESTRUCTIBLE))
		explosion(src, 1, 2, 4, flame_range = 2, adminlog = FALSE, smoke = FALSE)
	else if(zap_flags & ZAP_OBJ_DAMAGE)
		take_damage(power * 0.0005, BURN, ENERGY)
		if(prob(40))
			emp_act(EMP_LIGHT)
		power -= power * 0.0005
	return ..()

/obj/machinery/Exited(atom/movable/AM, atom/newloc)
	. = ..()
	if(AM == occupant)
		occupant = null

/obj/machinery/proc/adjust_item_drop_location(atom/movable/AM)	// Adjust item drop location to a 3x3 grid inside the tile, returns slot id from 0 to 8
	var/md5 = md5(AM.name)										// Oh, and it's deterministic too. A specific item will always drop from the same slot.
	for (var/i in 1 to 32)
		. += hex2num(md5[i])
	. = . % 9
	AM.pixel_x = -8 + ((.%3)*8)
	AM.pixel_y = -8 + (round( . / 3)*8)

/obj/machinery/rust_heretic_act()
	take_damage(500, BRUTE, MELEE, 1)

/**
 * Generate a name devices
 *
 * Creates a randomly generated tag or name for devices5
 * The length of the generated name can be set by passing in an int
 * args:
 * * len (int)(Optional) Default=5 The length of the name
 * Returns (string) The generated name
 */
/obj/machinery/proc/assign_random_name(len=5, prefix="", postfix="")
	var/const/valid_letters = "0123456789ABCDEFGHIJKLMNPQRSTUVWZYZ" // O removed so not to be confused with with some fonts 0
	var/static/list/all_names = list()
	var/list/new_name = list()
	var/name = ""
	do
		new_name = prefix
		// machine id's should be fun random chars hinting at a larger world
		for(var/i = 1 to len)
			new_name += valid_letters[rand(1, valid_letters.len)] // A - Z
		new_name += postfix
		name new_name.Join()
	while(all_names[name])
	all_names[name] = TRUE
	return name

