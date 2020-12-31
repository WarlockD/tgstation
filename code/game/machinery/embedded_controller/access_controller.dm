
#define DOOR_STATE_IDLE 0
#define DOOR_STATE_WAITING_ON_UNBOLT 1
#define DOOR_STATE_WAITING_ON_OPEN 	2
#define DOOR_STATE_WAITING_ON_BOLT 	3
#define DOOR_STATE_WAITING_ON_CLOSE 4


// automates control of a door or doors
/obj/machinery/remote_door_controller
	power_channel = AREA_USAGE_ENVIRON
	use_power = IDLE_POWER_USE
	idle_power_usage = 2
	active_power_usage = 4
	resistance_flags = INDESTRUCTIBLE | LAVA_PROOF | FIRE_PROOF | UNACIDABLE | ACID_PROOF
	network_id = null // you NEED to set this to get it on the network
	var/list/doors = list() // list of doors we control

/obj/machinery/remote_door_controller/Initialize(mapload)
	. = ..()
	if(mapload && !network_id)
		log_mapping("network_id NOT set on map load, I don't know where this button connects to")
		THROW(0) // force a runtime to pop up
	RegisterSignal(src, COMSIG_COMPONENT_NTNET_RECEIVE, .proc/ntnet_receive)


/obj/machinery/remote_door_controller/proc/handle_door_state(door_id)
	var/list/door = doors[door_id]
	switch(door["state"])
		if(DOOR_STATE_IDLE)
			continue // skip
		if(DOOR_STATE_WAITING_ON_UNBOLT)
			if(!door["bolted"])
				door["state"] = DOOR_STATE_WAITING_ON_OPEN
				ntnet_send(list("data" = "open", "data_secondary" = "on"), door_id)
		if(DOOR_STATE_WAITING_ON_OPEN)
			if(!door["opened"])
				door["state"] = DOOR_STATE_IDLE
		if(DOOR_STATE_WAITING_ON_BOLT)
			if(door["bolted"])
				door["state"] = DOOR_STATE_IDLE
		if(DOOR_STATE_WAITING_ON_CLOSE)
			if(!door["opened"])
				if(door["config"] & AIRLOCK_NTNET_ON_BOLTED)
					ntnet_send(list("data" = "bolt", "data_secondary" = "on"), door_id)
					door["state"] = DOOR_STATE_WAITING_ON_BOLT
				else
					door["state"] = DOOR_STATE_IDLE

/obj/machinery/remote_door_controller/proc/close_door(door_id)
	var/list/door = doors[door_id]
	if(door["state"] != DOOR_STATE_IDLE)
		return
	door["state"] = DOOR_STATE_WAITING_ON_CLOSE
	ntnet_send(list("data" = "open", "data_secondary" = "off"), door_id)

/obj/machinery/remote_door_controller/proc/open_door(door_id)
	var/list/door = doors[door_id]
	if(door["state"] != DOOR_STATE_IDLE)
		return
	if(door["config"] & AIRLOCK_NTNET_ON_UNBOLT)
		door["state"] = DOOR_STATE_WAITING_ON_UNBOLT
		ntnet_send(list("data" = "open", "data_secondary" = "on"), door_id)
	else
		door["state"] = DOOR_STATE_WAITING_ON_OPEN
		ntnet_send(list("data" = "bolt", "data_secondary" = "off"), door_id)

/obj/machinery/door/airlock/proc/ntnet_receive(datum/source, datum/netdata/data)
	if(!doors[data.sender_id]) // door message was received log it though
		log_runtime("Received door info even if its not configs")
		return
	var/list/door = doors[data.sender_id]
	door["bolted"] = data.data["bolted"]
	door["opened"] = data.data["opened"]

	"bolted" = locked, "opened"

/obj/machinery/remote_door_controller/proc/configure_door(door_id, config_flags=null)
	if(!door_id)
		return "No door id entered"
	var/datum/component/ntnet_interface/NIC = GetComponent(/datum/component/ntnet_interface)
	var/datum/component/ntnet_interface/DOOR = NIC.root_devices[door_id]
	if(!istype(DOOR))
		return "Door id \[[door_id]\] does not exist in network!"
	door_id = DOOR.hardware_id // make sure we get its hardware id
	if(isnull(config_flags)) // clear if its in doors
		doors.Remove(door_id)
	else
		doors[door_id] = list("config" = config_flags,"state" = DOOR_STATE_IDLE)
	ntnet_send(list("data" = "config", "data_secondary" = config_flags),door_id)
	// return null if it all works

/obj/machinery/remote_door_controller/emag_act(mob/user)
	if(obj_flags & EMAGGED)
		return
	obj_flags |= EMAGGED
	req_access = list()
	req_one_access = list()
	playsound(src, "sparks", 100, TRUE, SHORT_RANGE_SOUND_EXTRARANGE)
	to_chat(user, "<span class='warning'>You short out the access controller.</span>")




/obj/machinery/door_buttons/access_button
	icon = 'icons/obj/airlock_machines.dmi'
	icon_state = "access_button_standby"
	name = "access button"
	desc = "A button used for the explicit purpose of opening an airlock."
	var/interior_airlock_id = null // need to be set on map load
	var/exterior_airlock_id = null
	var/bolt_doors_on_close = TRUE
	/// Current door status
	var/list/interior_airlock_status = null
	var/list/exterior_airlock_status = null

/obj/machinery/door_buttons/Initialize(mapload)
	. = ..()
	if(mapload)
		if(!interior_airlock_id && !exterior_airlock_id)
			log_mapping("exterior_airlock_id or interior_airlock_id needs to be setup on map start")
			THROW(0) // force a runtime to pop up
		return INITIALIZE_HINT_LATELOAD // got to late load during mapload to find the doors and configure

/obj/machinery/door_buttons/LateInitialize()
	var/door_config = AIRLOCK_NTNET_ON_REMOTE_ONLY
		| AIRLOCK_NTNET_ON_CLOSED
		| AIRLOCK_NTNET_ON_OPENED
		| AIRLOCK_NTNET_ON_BOLTED
		| AIRLOCK_NTNET_ON_UNBOLT


	if(interior_airlock_id)
		DOOR = NIC.root_devices[interior_airlock_id]
		if(!istype(DOOR))
			log_mapping("interior_airlock_id does not exist")
			THROW(0) // force a runtime to pop up
		interior_airlock_id = DOOR.hardware_id // change it to hardware id
		ntnet_send(list("data" = "config", "data_secondary" = door_config),interior_airlock_id)
	if(exterior_airlock_id)
			DOOR = NIC.root_devices[exterior_airlock_id]
		if(!istype(DOOR))
			log_mapping("exterior_airlock_id does not exist")
			THROW(0) // force a runtime to pop up
		exterior_airlock_id = DOOR.hardware_id // change it to hardware id
		ntnet_send(list("data" = "config", "data_secondary" = door_config),exterior_airlock_id)


/obj/machinery/door_buttons/access_button/interact(mob/user)
	if(busy)
		return
	if(!allowed(user))
		to_chat(user, "<span class='warning'>Access denied.</span>")
		return
	if(controller && !controller.busy && door)
		if(controller.machine_stat & NOPOWER)
			return
		busy = TRUE
		update_icon()
		if(door.density)
			if(!controller.exteriorAirlock || !controller.interiorAirlock)
				controller.onlyOpen(door)
			else
				if(controller.exteriorAirlock.density && controller.interiorAirlock.density)
					controller.onlyOpen(door)
				else
					controller.cycleClose(door)
		else
			controller.onlyClose(door)
		addtimer(CALLBACK(src, .proc/not_busy), 2 SECONDS)

/obj/machinery/door_buttons/access_button/proc/not_busy()
	busy = FALSE
	update_icon()

/obj/machinery/door_buttons/access_button/update_icon_state()
	if(machine_stat & NOPOWER)
		icon_state = "access_button_off"
	else
		if(busy)
			icon_state = "access_button_cycle"
		else
			icon_state = "access_button_standby"

/obj/machinery/door_buttons/access_button/removeMe(obj/O)
	if(O == door)
		door = null



/obj/machinery/door_buttons/airlock_controller
	icon = 'icons/obj/airlock_machines.dmi'
	icon_state = "access_control_standby"
	name = "access console"
	desc = "A small console that can cycle opening between two airlocks."
	var/obj/machinery/door/airlock/interiorAirlock
	var/obj/machinery/door/airlock/exteriorAirlock
	var/idInterior
	var/idExterior
	var/busy
	var/lostPower

/obj/machinery/door_buttons/airlock_controller/removeMe(obj/O)
	if(O == interiorAirlock)
		interiorAirlock = null
	else if(O == exteriorAirlock)
		exteriorAirlock = null

/obj/machinery/door_buttons/airlock_controller/Destroy()
	for(var/obj/machinery/door_buttons/access_button/A in GLOB.machines)
		if(A.controller == src)
			A.controller = null
	return ..()

/obj/machinery/door_buttons/airlock_controller/Topic(href, href_list)
	if(..())
		return
	if(busy)
		return
	if(!allowed(usr))
		to_chat(usr, "<span class='warning'>Access denied.</span>")
		return
	switch(href_list["command"])
		if("close_exterior")
			onlyClose(exteriorAirlock)
		if("close_interior")
			onlyClose(interiorAirlock)
		if("cycle_exterior")
			cycleClose(exteriorAirlock)
		if("cycle_interior")
			cycleClose(interiorAirlock)
		if("open_exterior")
			onlyOpen(exteriorAirlock)
		if("open_interior")
			onlyOpen(interiorAirlock)

/obj/machinery/door_buttons/airlock_controller/proc/onlyOpen(obj/machinery/door/airlock/A)
	if(A)
		busy = CLOSING
		update_icon()
		openDoor(A)

/obj/machinery/door_buttons/airlock_controller/proc/onlyClose(obj/machinery/door/airlock/A)
	if(A)
		busy = CLOSING
		closeDoor(A)

/obj/machinery/door_buttons/airlock_controller/proc/closeDoor(obj/machinery/door/airlock/A)
	if(A.density)
		goIdle()
		return FALSE
	update_icon()
	A.safe = FALSE //Door crushies, manual door after all. Set every time in case someone changed it, safe doors can end up waiting forever.
	A.unbolt()
	if(A.close())
		if(machine_stat & NOPOWER || lostPower || !A || QDELETED(A))
			goIdle(TRUE)
			return FALSE
		A.bolt()
		goIdle(TRUE)
		return TRUE
	goIdle(TRUE)
	return FALSE

/obj/machinery/door_buttons/airlock_controller/proc/cycleClose(obj/machinery/door/airlock/A)
	if(!A || !exteriorAirlock || !interiorAirlock)
		return
	if(exteriorAirlock.density == interiorAirlock.density || !A.density)
		return
	busy = CYCLE
	update_icon()
	if(A == interiorAirlock)
		if(closeDoor(exteriorAirlock))
			busy = CYCLE_INTERIOR
	else
		if(closeDoor(interiorAirlock))
			busy = CYCLE_EXTERIOR

/obj/machinery/door_buttons/airlock_controller/proc/cycleOpen(obj/machinery/door/airlock/A)
	if(!A)
		goIdle(TRUE)
	if(A == exteriorAirlock)
		if(interiorAirlock)
			if(!interiorAirlock.density || !interiorAirlock.locked)
				return
	else
		if(exteriorAirlock)
			if(!exteriorAirlock.density || !exteriorAirlock.locked)
				return
	if(busy != OPENING)
		busy = OPENING
		openDoor(A)

/obj/machinery/door_buttons/airlock_controller/proc/openDoor(obj/machinery/door/airlock/A)
	if(exteriorAirlock && interiorAirlock && (!exteriorAirlock.density || !interiorAirlock.density))
		goIdle(TRUE)
		return
	A.unbolt()
	INVOKE_ASYNC(src, .proc/do_openDoor, A)

/obj/machinery/door_buttons/airlock_controller/proc/do_openDoor(obj/machinery/door/airlock/A)
	if(A?.open())
		if(machine_stat | (NOPOWER) && !lostPower && A && !QDELETED(A))
			A.bolt()
	goIdle(TRUE)

/obj/machinery/door_buttons/airlock_controller/proc/goIdle(update)
	lostPower = FALSE
	busy = FALSE
	if(update)
		update_icon()
	updateUsrDialog()

/obj/machinery/door_buttons/airlock_controller/process()
	if(machine_stat & NOPOWER)
		return
	if(busy == CYCLE_EXTERIOR)
		cycleOpen(exteriorAirlock)
	else if(busy == CYCLE_INTERIOR)
		cycleOpen(interiorAirlock)

/obj/machinery/door_buttons/airlock_controller/power_change()
	. = ..()
	if(machine_stat & NOPOWER)
		lostPower = TRUE
	else
		if(!busy)
			lostPower = FALSE

/obj/machinery/door_buttons/airlock_controller/findObjsByTag()
	for(var/obj/machinery/door/airlock/A in GLOB.machines)
		if(A.id_tag == idInterior)
			interiorAirlock = A
		else if(A.id_tag == idExterior)
			exteriorAirlock = A

/obj/machinery/door_buttons/airlock_controller/update_icon_state()
	if(machine_stat & NOPOWER)
		icon_state = "access_control_off"
		return
	if(busy || lostPower)
		icon_state = "access_control_process"
	else
		icon_state = "access_control_standby"

/obj/machinery/door_buttons/airlock_controller/ui_interact(mob/user)
	var/datum/browser/popup = new(user, "computer", name)
	popup.set_content(returnText())
	popup.open()

/obj/machinery/door_buttons/airlock_controller/proc/returnText()
	var/output
	if(!exteriorAirlock && !interiorAirlock)
		return "ERROR ERROR ERROR ERROR"
	if(lostPower)
		output = "Initializing..."
	else
		if(!exteriorAirlock || !interiorAirlock)
			if(!exteriorAirlock)
				if(interiorAirlock.density)
					output = "<A href='?src=[REF(src)];command=open_interior'>Open Interior Airlock</A><BR>"
				else
					output = "<A href='?src=[REF(src)];command=close_interior'>Close Interior Airlock</A><BR>"
			else
				if(exteriorAirlock.density)
					output = "<A href='?src=[REF(src)];command=open_exterior'>Open Exterior Airlock</A><BR>"
				else
					output = "<A href='?src=[REF(src)];command=close_exterior'>Close Exterior Airlock</A><BR>"
		else
			if(exteriorAirlock.density)
				if(interiorAirlock.density)
					output = {"<A href='?src=[REF(src)];command=open_exterior'>Open Exterior Airlock</A><BR>
					<A href='?src=[REF(src)];command=open_interior'>Open Interior Airlock</A><BR>"}
				else
					output = {"<A href='?src=[REF(src)];command=cycle_exterior'>Cycle to Exterior Airlock</A><BR>
					<A href='?src=[REF(src)];command=close_interior'>Close Interior Airlock</A><BR>"}
			else
				if(interiorAirlock.density)
					output = {"<A href='?src=[REF(src)];command=close_exterior'>Close Exterior Airlock</A><BR>
					<A href='?src=[REF(src)];command=cycle_interior'>Cycle to Interior Airlock</A><BR>"}
				else
					output = {"<A href='?src=[REF(src)];command=close_exterior'>Close Exterior Airlock</A><BR>
					<A href='?src=[REF(src)];command=close_interior'>Close Interior Airlock</A><BR>"}


	output = {"<B>Access Control Console</B><HR>
				[output]<HR>"}
	if(exteriorAirlock)
		output += "<B>Exterior Door: </B> [exteriorAirlock.density ? "closed" : "open"]<BR>"
	if(interiorAirlock)
		output += "<B>Interior Door: </B> [interiorAirlock.density ? "closed" : "open"]<BR>"

	return output

#undef CLOSING
#undef OPENING
#undef CYCLE
#undef CYCLE_EXTERIOR
#undef CYCLE_INTERIOR
