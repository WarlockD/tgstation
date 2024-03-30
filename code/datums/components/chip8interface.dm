/datum/component/chip8
	var/rom = "" // rom in base64
	var/emped = FALSE
	var/datum/ui_state/state = null

/datum/component/chip8/Initialize()
	if(!isatom(parent))
		return COMPONENT_INCOMPATIBLE

/datum/component/chip8/item/Initialize(emp_proof=TRUE)
	. = ..()
	if(. == COMPONENT_INCOMPATIBLE || !isitem(parent))
		return COMPONENT_INCOMPATIBLE

	if(isnull(state))
		state = GLOB.default_state
	src.state = state

	var/atom/A = parent
	A.name = "[initial(A.name)]"
	RegisterSignal(parent, COMSIG_ITEM_ATTACK_SELF, PROC_REF(interact))
	//if(!emp_proof)
	//	RegisterSignal(parent, COMSIG_ATOM_EMP_ACT, PROC_REF(on_emp_act))
	//RegisterSignal(parent, COMSIG_ATOM_EXAMINE, PROC_REF(on_examine))
	//RegisterSignal(parent, COMSIG_CLICK_ALT, PROC_REF(on_AltClick))

///Called on COMSIG_ITEM_ATTACK_SELF
/datum/component/chip8/item/proc/interact(datum/source, mob/user)
	SIGNAL_HANDLER

	if(user)
		INVOKE_ASYNC(src, PROC_REF(ui_interact), user)

///Called on COMSIG_ATOM_EXAMINE
/datum/component/chip8/item/proc/on_examine(datum/source, mob/user, list/examine_list)
	SIGNAL_HANDLER

	//examine_list += span_notice("Alt-click to switch it [tracking ? "off":"on"].")


/datum/component/chip8/item/ui_interact(mob/user, datum/tgui/ui)
	if(emped)
		to_chat(user, span_hear("[parent] fizzles weakly."))
		return
	ui = SStgui.try_update_ui(user, src, ui)
	if(!ui)
		ui = new(user, src, "Chip8")
		ui.open()
	//ui.set_autoupdate(FALSE)


/datum/component/gps/item/ui_interact(mob/user, datum/tgui/ui)
	//if(emped)
	//	to_chat(user, span_hear("[parent] fizzles weakly."))
	//	return
	ui = SStgui.try_update_ui(user, src, ui)
	if(!ui)
		ui = new(user, src, "Chip8")
		ui.open()
	ui.set_autoupdate(updating)

/datum/component/chip8/item/ui_state(mob/user)
	return state

/datum/component/chip8/item/ui_static_data(mob/user)
	var/list/data = list()
	data["rom"] = rom
	data["screen_width"] = 128
	data["screen_height"] = 64
	return data

/datum/component/chip8/item/ui_data(mob/user)
	var/list/data = list()
	data["memory_offset"] = 0x10
	data["string"] = TRUE
	data["memory_update"] = "1234556"

	return data

/datum/component/gps/item/ui_act(action, params)
	. = ..()
	if(.)
		return
	world << "Action Pressed=" << action

	switch(action)
		if("button")
			world << "Pressed the button" + params["pressed"]
			. = TRUE

		if("output")
			world << "Sent from output port" + params["port"]
			. = TRUE
