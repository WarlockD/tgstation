
#define GASMINER_POWER_NONE 0
#define GASMINER_POWER_STATIC 1
#define GASMINER_POWER_MOLES 2	//Scaled from here on down.
#define GASMINER_POWER_KPA 3
#define GASMINER_POWER_FULLSCALE 4

/obj/machinery/atmospherics/miner
	name = "gas miner"
	desc = "Gasses mined from the gas giant below (above?) flow out through this massive vent."
	icon = 'icons/obj/atmospherics/components/miners.dmi'
	icon_state = "miner"
	density = FALSE
	resistance_flags = INDESTRUCTIBLE|ACID_PROOF|FIRE_PROOF
	var/spawn_id = null
	var/spawn_temp = T20C
	/// Moles of gas to spawn per second
	var/spawn_mol = MOLES_CELLSTANDARD * 5
	var/max_ext_mol = INFINITY
	var/max_ext_kpa = 6500
	var/overlay_color = "#FFFFFF"
	var/active = TRUE
	var/power_draw = 0
	var/power_draw_static = 2000
	var/power_draw_dynamic_mol_coeff = 5	//DO NOT USE DYNAMIC SETTINGS UNTIL SOMEONE MAKES A USER INTERFACE/CONTROLLER FOR THIS!
	var/power_draw_dynamic_kpa_coeff = 0.5
	var/broken = FALSE
	var/broken_message = "ERROR"
	idle_power_usage = 150
	active_power_usage = 2000

/obj/machinery/atmospherics/miner/Initialize()
	. = ..()
	set_active(active)				//Force overlay update.

/obj/machinery/atmospherics/miner/examine(mob/user)
	. = ..()
	if(broken)
		. += {"Its debug output is printing "[broken_message]"."}

/obj/machinery/atmospherics/miner/proc/check_operation()
	if(!active)
		return FALSE
	var/turf/T = get_turf(src)
	if(!isopenturf(T))
		broken_message = "<span class='boldnotice'>VENT BLOCKED</span>"
		set_broken(TRUE)
		return FALSE
	var/turf/open/OT = T
	if(OT.planetary_atmos)
		broken_message = "<span class='boldwarning'>DEVICE NOT ENCLOSED IN A PRESSURIZED ENVIRONMENT</span>"
		set_broken(TRUE)
		return FALSE
	if(isspaceturf(T))
		broken_message = "<span class='boldnotice'>AIR VENTING TO SPACE</span>"
		set_broken(TRUE)
		return FALSE
	var/datum/gas_mixture/G = OT.return_air()
	if(G.return_pressure() > (max_ext_kpa - ((spawn_mol*spawn_temp*R_IDEAL_GAS_EQUATION)/(CELL_VOLUME))))
		broken_message = "<span class='boldwarning'>EXTERNAL PRESSURE OVER THRESHOLD</span>"
		set_broken(TRUE)
		return FALSE
	if(G.total_moles() > max_ext_mol)
		broken_message = "<span class='boldwarning'>EXTERNAL AIR CONCENTRATION OVER THRESHOLD</span>"
		set_broken(TRUE)
		return FALSE
	if(broken)
		set_broken(FALSE)
		broken_message = ""
	return TRUE

/obj/machinery/atmospherics/miner/proc/set_active(setting)
	if(active != setting)
		active = setting
		update_icon()

/obj/machinery/atmospherics/miner/proc/set_broken(setting)
	if(broken != setting)
		broken = setting
		update_icon()

/obj/machinery/atmospherics/miner/proc/update_power()
	if(!active)
		active_power_usage = idle_power_usage
	var/turf/T = get_turf(src)
	var/datum/gas_mixture/G = T.return_air()
	var/P = G.return_pressure()
	switch(power_draw)
		if(GASMINER_POWER_NONE)
			active_power_usage = 0
		if(GASMINER_POWER_STATIC)
			active_power_usage = power_draw_static
		if(GASMINER_POWER_MOLES)
			active_power_usage = spawn_mol * power_draw_dynamic_mol_coeff
		if(GASMINER_POWER_KPA)
			active_power_usage = P * power_draw_dynamic_kpa_coeff
		if(GASMINER_POWER_FULLSCALE)
			active_power_usage = (spawn_mol * power_draw_dynamic_mol_coeff) + (P * power_draw_dynamic_kpa_coeff)

/obj/machinery/atmospherics/miner/proc/do_use_power(amount)
	var/turf/T = get_turf(src)
	if(T && istype(T))
		var/obj/structure/cable/C = T.get_cable_node() //check if we have a node cable on the machine turf, the first found is picked
		if(C && C.powernet && (C.powernet.avail > amount))
			C.powernet.load += amount
			return TRUE
	if(powered())
		use_power(amount)
		return TRUE
	return FALSE

/obj/machinery/atmospherics/miner/update_overlays()
	. = ..()
	if(broken)
		. += "broken"
	else if(active)
		var/mutable_appearance/on_overlay = mutable_appearance(icon, "on")
		on_overlay.color = overlay_color
		. += on_overlay

/obj/machinery/atmospherics/miner/process(delta_time)
	update_power()
	check_operation()
	if(active && !broken)
		if(isnull(spawn_id))
			return FALSE
		if(do_use_power(active_power_usage))
			mine_gas(delta_time)

/obj/machinery/atmospherics/miner/proc/mine_gas(delta_time = 2)
	var/turf/open/O = get_turf(src)
	if(!isopenturf(O))
		return FALSE
	var/datum/gas_mixture/merger = new
	merger.assert_gas(spawn_id)
	merger.gases[spawn_id][MOLES] = spawn_mol * delta_time
	merger.temperature = spawn_temp
	O.assume_air(merger)
	O.air_update_turf(TRUE)

/obj/machinery/atmospherics/miner/attack_ai(mob/living/silicon/user)
	if(broken)
		to_chat(user, "[src] seems to be broken. Its debug interface outputs: [broken_message]")
	..()

/obj/machinery/atmospherics/miner/n2o
	name = "\improper N2O Gas Miner"
	overlay_color = "#FFCCCC"
	spawn_id = /datum/gas/nitrous_oxide

/obj/machinery/atmospherics/miner/nitrogen
	name = "\improper N2 Gas Miner"
	overlay_color = "#CCFFCC"
	spawn_id = /datum/gas/nitrogen

/obj/machinery/atmospherics/miner/oxygen
	name = "\improper O2 Gas Miner"
	overlay_color = "#007FFF"
	spawn_id = /datum/gas/oxygen

/obj/machinery/atmospherics/miner/toxins
	name = "\improper Plasma Gas Miner"
	overlay_color = "#FF0000"
	spawn_id = /datum/gas/plasma

/obj/machinery/atmospherics/miner/carbon_dioxide
	name = "\improper CO2 Gas Miner"
	overlay_color = "#CDCDCD"
	spawn_id = /datum/gas/carbon_dioxide

/obj/machinery/atmospherics/miner/bz
	name = "\improper BZ Gas Miner"
	overlay_color = "#FAFF00"
	spawn_id = /datum/gas/bz

/obj/machinery/atmospherics/miner/water_vapor
	name = "\improper Water Vapor Gas Miner"
	overlay_color = "#99928E"
	spawn_id = /datum/gas/water_vapor

/obj/machinery/atmospherics/miner/freon
	name = "\improper Freon Gas Miner"
	overlay_color = "#61edff"
	spawn_id = /datum/gas/freon

/obj/machinery/atmospherics/miner/halon
	name = "\improper Halon Gas Miner"
	overlay_color = "#5f0085"
	spawn_id = /datum/gas/halon

/obj/machinery/atmospherics/miner/healium
	name = "\improper Healium Gas Miner"
	overlay_color = "#da4646"
	spawn_id = /datum/gas/healium

/obj/machinery/atmospherics/miner/hexane
	name = "\improper Hexane Gas Miner"
	overlay_color = "#d113e2"
	spawn_id = /datum/gas/hexane

/obj/machinery/atmospherics/miner/hydrogen
	name = "\improper Hydrogen Gas Miner"
	overlay_color = "#ffffff"
	spawn_id = /datum/gas/hydrogen

/obj/machinery/atmospherics/miner/hypernoblium
	name = "\improper Hypernoblium Gas Miner"
	overlay_color = "#00f7ff"
	spawn_id = /datum/gas/hypernoblium

/obj/machinery/atmospherics/miner/miasma
	name = "\improper Miasma Gas Miner"
	overlay_color = "#395806"
	spawn_id = /datum/gas/miasma

/obj/machinery/atmospherics/miner/nitryl
	name = "\improper Nitryl Gas Miner"
	overlay_color = "#752b00"
	spawn_id = /datum/gas/nitryl

/obj/machinery/atmospherics/miner/pluoxium
	name = "\improper Pluoxium Gas Miner"
	overlay_color = "#4b54a3"
	spawn_id = /datum/gas/pluoxium

/obj/machinery/atmospherics/miner/proto_nitrate
	name = "\improper Proto-Nitrate Gas Miner"
	overlay_color = "#00571d"
	spawn_id = /datum/gas/proto_nitrate

/obj/machinery/atmospherics/miner/stimulum
	name = "\improper Stimulum Gas Miner"
	overlay_color = "#d577dd"
	spawn_id = /datum/gas/stimulum

/obj/machinery/atmospherics/miner/tritium
	name = "\improper Tritium Gas Miner"
	overlay_color = "#15ff00"
	spawn_id = /datum/gas/tritium

/obj/machinery/atmospherics/miner/zauker
	name = "\improper Zauker Gas Miner"
	overlay_color = "#022e00"
	spawn_id = /datum/gas/zauker


/proc/cmp_list_name(list/a, list/b) // simple sort for gas names on display
	return sorttext(a["name"], b["name"])

// ONLY FOR ADMIN AND MAP TESTERS, THIS DOES SOME FUCKED UP STUFF
/obj/machinery/atmospherics/miner/debug
	var/list/supported_gases	// list of sorted gasses for the display
	var/list/gas_lookup // because I HATE gas_id2path
	power_draw = GASMINER_POWER_NONE
	active = FALSE // Make sure we are off


/obj/machinery/atmospherics/miner/debug/Initialize()
	. = ..()
	var/list/gas_types = supported_gases
	if(!gas_types)
		gas_types = subtypesof(/datum/gas)
	gas_lookup = list()
	supported_gases = list()
	for(var/gas_path in gas_types)
		var/datum/gas/gas = gas_path
		var/list/gas_info = list()
		gas_info["name"] = initial(gas.name)
		gas_info["id"] = initial(gas.id)
		gas_info["path"] = gas_path
		gas_lookup[gas_info["path"]] = gas_info
		gas_lookup[gas_info["id"]] = gas_info
		supported_gases += list(gas_info)

	sortTim(supported_gases, /proc/cmp_list_name)

	name = "\improper Unset Gas Miner"

/obj/machinery/atmospherics/miner/debug/can_interact(mob/user)
	if(check_rights_for(user.client, R_ADMIN)) // Are they allowed?
		return TRUE

/obj/machinery/atmospherics/miner/debug/ui_interact(mob/user)
	. = ..()
	var/list/builder = list()

	builder += "DEBUG GAS MINER: [name]<BR>";
	builder += "ACTIVE=<B>[active]</B>: [name]<A href='?src=[REF(src)];toggle_active=1'>TOGGLE</A><BR>";
	var/current_gas_name = spawn_id == null ? "NO GAS SELECTED" : gas_lookup[spawn_id]["name"]
	builder += "GAS=<B>[current_gas_name]</B><BR>";

	builder += "<b>Gasses:</b><ul>"
	for(var/list/gas_info in supported_gases)
		var/id = gas_info["id"]
		var/gas_name = gas_info["name"]
		builder += "<li><a href='?src=[REF(src)]&gas=[id]'>[gas_name]</a></li>"

	builder += "</ul>"
	var/dat = builder.Join()

	user << browse("<HEAD><TITLE>[src]</TITLE></HEAD><TT>[dat]</TT>", "window=gasminer")
	onclose(user, "gasminer")

/obj/machinery/atmospherics/miner/debug/Topic(href, href_list)
	if(..())
		return 1
	to_chat(world, "CLICK! [href]")

	if(href_list["toggle_active"])
		set_active(active ? FALSE : TRUE)
	if(href_list["gas"])
		var/list/gas_info = gas_lookup[href_list["gas"]]
		if(!gas_info)
			to_chat(usr, "Error bad gas id?  We shouldn't be here")
		else
			spawn_id = gas_info["path"]
			var/gas_name = gas_info["name"]
			name = "\improper [gas_name] Gas Miner"
