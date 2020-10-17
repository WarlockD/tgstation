/obj/machinery/cell_charger
	name = "cell charger"
	desc = "It charges power cells."
	icon = 'icons/obj/power.dmi'
	icon_state = "ccharger"
	use_power = IDLE_POWER_USE
	idle_power_usage = 5
	active_power_usage = 60
	power_channel = AREA_USAGE_EQUIP
	power_setting = MACHINE_SETTING_USE_APC
	circuit = /obj/item/circuitboard/machine/cell_charger
	pass_flags = PASSTABLE
	cell_charging_power_usage = 250

/obj/machinery/cell_charger/update_overlays()
	. = ..()
	var/obj/item/stock_parts/cell/charging = cell
	if(!charging)
		return

	. += image(charging.icon, charging.icon_state)
	. += "ccharger-on"
	if(MACHINE_IS_OPERATIONAL(src))
		var/newlevel = 	round(charging.percent() * 4 / 100)
		. += "ccharger-o[newlevel]"

/obj/machinery/cell_charger/examine(mob/user)
	. = ..()
	var/obj/item/stock_parts/cell/charging = cell
	. += "There's [charging ? "a" : "no"] cell in the charger."
	if(charging)
		. += "Current charge: [round(charging.percent(), 1)]%."
	if(in_range(user, src) || isobserver(user))
		. += "<span class='notice'>The status display reads: Charging power: <b>[charge_rate]W</b>.</span>"

/obj/machinery/cell_charger/attackby(obj/item/W, mob/user, params)
	if(istype(W, /obj/item/stock_parts/cell) && !panel_open)
		if(machine_stat & MACHINE_STAT_BROKEN)
			to_chat(user, "<span class='warning'>[src] is broken!</span>")
			return
		if(!anchored)
			to_chat(user, "<span class='warning'>[src] isn't attached to the ground!</span>")
			return
		if(cell)
			to_chat(user, "<span class='warning'>There is already a cell in the charger!</span>")
			return
		else
			var/area/a = loc.loc // Gets our locations location, like a dream within a dream
			if(!isarea(a))
				return
			if(a.power_equip == 0) // There's no APC in this area, don't try to cheat power!
				to_chat(user, "<span class='warning'>[src] blinks red as you try to insert the cell!</span>")
				return
			if(!user.transferItemToLoc(W,src))

				return

			user.visible_message("<span class='notice'>[user] inserts a cell into [src].</span>", "<span class='notice'>You insert a cell into [src].</span>")
			RefreshParts()
			update_icon()
	else
		if(!charging && default_deconstruction_screwdriver(user, icon_state, icon_state, W))
			return
		if(default_deconstruction_crowbar(W))
			return
		if(!charging && default_unfasten_wrench(user, W))
			return
		return ..()



/obj/machinery/cell_charger/proc/removecell()
	var/obj/item/stock_parts/cell/charging = cell
	component_parts.Remove(cell)
	charging.update_icon()
	charging = null
	update_icon()

/obj/machinery/cell_charger/attack_hand(mob/user)
	. = ..()
	if(.)
		return
	var/obj/item/stock_parts/cell/charging = cell
	if(!charging)
		return

	user.put_in_hands(charging)
	charging.add_fingerprint(user)

	user.visible_message("<span class='notice'>[user] removes [charging] from [src].</span>", "<span class='notice'>You remove [charging] from [src].</span>")

	removecell()

/obj/machinery/cell_charger/attack_tk(mob/user)
	var/obj/item/stock_parts/cell/charging = cell
	if(!charging)
		return

	charging.forceMove(loc)
	to_chat(user, "<span class='notice'>You telekinetically remove [charging] from [src].</span>")

	removecell()

/obj/machinery/cell_charger/attack_ai(mob/user)
	return

/obj/machinery/cell_charger/emp_act(severity)
	. = ..()

	if(machine_stat & (MACHINE_STAT_BROKEN|MACHINE_STAT_NOPOWER) || . & EMP_PROTECT_CONTENTS)
		return
	var/obj/item/stock_parts/cell/charging = cell
	if(charging)
		charging.emp_act(severity)

/obj/machinery/cell_charger/RefreshParts()
	cell_charging_power_usage = initial(cell_charging_power_usage)
	for(var/obj/item/stock_parts/capacitor/C in component_parts)
		cell_charging_power_usage *= C.rating

/obj/machinery/cell_charger/process(delta_time)
	var/obj/item/stock_parts/cell/charging = cell
	if(!charging || !anchored || (machine_stat & (MACHINE_STAT_BROKEN|MACHINE_STAT_NOPOWER)))
		return

	if(charging.percent() >= 100)
		return
	use_power(charge_rate * delta_time)
	_charge_cell(charge_rate * delta_time) //this is 2558, efficient batteries exist ... sure

	update_icon()
