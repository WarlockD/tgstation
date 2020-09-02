#define PROXIMITY_NONE ""
#define PROXIMITY_ON_SCREEN "_red"
#define PROXIMITY_NEAR "_yellow"

/**
 * Multitool -- A multitool is used for hacking electronic devices.
 *
 */




/obj/item/multitool
	name = "multitool"
	desc = "Used for pulsing wires to test which to cut. Not recommended by doctors."
	icon = 'icons/obj/device.dmi'
	icon_state = "multitool"
	inhand_icon_state = "multitool"
	lefthand_file = 'icons/mob/inhands/equipment/tools_lefthand.dmi'
	righthand_file = 'icons/mob/inhands/equipment/tools_righthand.dmi'
	force = 5
	w_class = WEIGHT_CLASS_SMALL
	tool_behaviour = TOOL_MULTITOOL
	throwforce = 0
	throw_range = 7
	throw_speed = 3
	drop_sound = 'sound/items/handling/multitool_drop.ogg'
	pickup_sound =  'sound/items/handling/multitool_pickup.ogg'
	custom_materials = list(/datum/material/iron=50, /datum/material/glass=20)
	custom_premium_price = 450
	toolspeed = 1
	usesound = 'sound/weapons/empty.ogg'
	var/buffer = null 		//  buffer for device linkage, made it weak in case it dissapers
	var/mode = 0

/obj/item/multitool/examine(mob/user)
	. = ..()
	. += "<span class='notice'>Its buffer [buffer ? "contains [buffer]." : "is empty."]</span>"

/obj/item/multitool/suicide_act(mob/living/carbon/user)
	user.visible_message("<span class='suicide'>[user] puts the [src] to [user.p_their()] chest. It looks like [user.p_theyre()] trying to pulse [user.p_their()] heart off!</span>")
	return OXYLOSS//theres a reason it wasn't recommended by doctors

///Check if the multitool has an item in it's data buffer.
/obj/item/multitool/proc/check_buffer(mob/living/carbon/user = null)
	if(!buffer)
		if(user)
			to_chat(user, "<span class='warning'>The multitool has no data buffer!</span>")
		return null
	return buffer

/obj/item/multitool/proc/clear_buffer()
	SIGNAL_HANDLER
	if(buffer)
		UnregisterSignal(buffer, COMSIG_PARENT_QDELETING)
		buffer = null

/obj/item/multitool/proc/save_buffer(datum/thing)
	clear_buffer()
	if(!QDELETED(thing))
		buffer = thing
		RegisterSignal(buffer, COMSIG_PARENT_QDELETING, .proc/clear_buffer)

/obj/item/multitool/Destroy()
	clear_buffer()
	return ..()

/obj/item/multitool/proc/check_menu(mob/living/user)
	if(!istype(user))
		return FALSE
	if(user.incapacitated() || !user.Adjacent(src))
		return FALSE
	return TRUE

/obj/item/multitool/proc/test_buffer(expected_path)
	if(!buffer || !expected_path)
		return
	if(ispath(expected_path))
		return istype(buffer,expected_path)
	else if(islist(expected_path))
		var/list/L = expected_path
		for(var/i in 1 to L.len)
			if(ispath(L[i]))
				return TRUE

// So, lets make this universal and simple.  If something wants to copy settings from one to another
// it calls this.  The users says "copy" or "link"  That is it will either copy the current thing to the buffer
// or if its the same type as expect_path, return the buffer
/obj/item/multitool/proc/buffer_menu(mob/user, datum/thing, obj/target, expected_path)
	var/list/choices = list()
	if(thing)
		choices["Copy"] = image(icon = 'icons/mob/screen_pai.dmi', icon_state = "pda_recieve")
	if(target && test_buffer(expected_path))
		choices["Send"] = image(icon= 'icons/mob/screen_pai.dmi', icon_state = "pda_send")
	if(!choices.len) LAZYACCESS
		return
	var/choice = choices.len == 1 ? choicesshow_radial_menu(user, src, choices, custom_check = CALLBACK(src, .proc/check_menu, user), require_near = TRUE, tooltips = TRUE)
	if(!check_menu(user))
		return
	switch(choice)
		if("Copy")
			save_buffer(thing)
			to_chat(user, "<span class='notice'>'[thing]' was saved to the multitool buffer</span>")
		if("Send")
			// we already know that the buffer contains the thing the device wants, so just send it
			to_chat(user, "<span class='notice'>Linking '[thing]' to [target]</span>")
			return buffer



// Syndicate device disguised as a multitool; it will turn red when an AI camera is nearby.

/obj/item/multitool/ai_detect
	var/track_cooldown = 0
	var/track_delay = 10 //How often it checks for proximity
	var/detect_state = PROXIMITY_NONE
	var/rangealert = 8	//Glows red when inside
	var/rangewarning = 20 //Glows yellow when inside
	var/hud_type = DATA_HUD_AI_DETECT
	var/hud_on = FALSE
	var/mob/camera/ai_eye/remote/ai_detector/eye
	var/datum/action/item_action/toggle_multitool/toggle_action

/obj/item/multitool/ai_detect/Initialize()
	. = ..()
	START_PROCESSING(SSobj, src)
	eye = new /mob/camera/ai_eye/remote/ai_detector()
	toggle_action = new /datum/action/item_action/toggle_multitool(src)

/obj/item/multitool/ai_detect/Destroy()
	STOP_PROCESSING(SSobj, src)
	if(hud_on && ismob(loc))
		remove_hud(loc)
	QDEL_NULL(toggle_action)
	QDEL_NULL(eye)
	return ..()

/obj/item/multitool/ai_detect/ui_action_click()
	return

/obj/item/multitool/ai_detect/equipped(mob/living/carbon/human/user, slot)
	..()
	if(hud_on)
		show_hud(user)

/obj/item/multitool/ai_detect/dropped(mob/living/carbon/human/user)
	..()
	if(hud_on)
		remove_hud(user)

/obj/item/multitool/ai_detect/process()
	if(track_cooldown > world.time)
		return
	detect_state = PROXIMITY_NONE
	if(eye.eye_user)
		eye.setLoc(get_turf(src))
	multitool_detect()
	update_icon()
	track_cooldown = world.time + track_delay

/obj/item/multitool/ai_detect/proc/toggle_hud(mob/user)
	hud_on = !hud_on
	if(user)
		to_chat(user, "<span class='notice'>You toggle the ai detection HUD on [src] [hud_on ? "on" : "off"].</span>")
	if(hud_on)
		show_hud(user)
	else
		remove_hud(user)

/obj/item/multitool/ai_detect/proc/show_hud(mob/user)
	if(user && hud_type)
		var/obj/screen/plane_master/camera_static/PM = user.hud_used.plane_masters["[CAMERA_STATIC_PLANE]"]
		PM.alpha = 150
		var/datum/atom_hud/H = GLOB.huds[hud_type]
		if(!H.hudusers[user])
			H.add_hud_to(user)
		eye.eye_user = user
		eye.setLoc(get_turf(src))

/obj/item/multitool/ai_detect/proc/remove_hud(mob/user)
	if(user && hud_type)
		var/obj/screen/plane_master/camera_static/PM = user.hud_used.plane_masters["[CAMERA_STATIC_PLANE]"]
		PM.alpha = 255
		var/datum/atom_hud/H = GLOB.huds[hud_type]
		H.remove_hud_from(user)
		if(eye)
			eye.setLoc(null)
			eye.eye_user = null

/obj/item/multitool/ai_detect/proc/multitool_detect()
	var/turf/our_turf = get_turf(src)
	for(var/mob/living/silicon/ai/AI in GLOB.ai_list)
		if(AI.cameraFollow == src)
			detect_state = PROXIMITY_ON_SCREEN
			break

	if(detect_state)
		return
	var/datum/camerachunk/chunk = GLOB.cameranet.chunkGenerated(our_turf.x, our_turf.y, our_turf.z)
	if(chunk && chunk.seenby.len)
		for(var/mob/camera/ai_eye/A in chunk.seenby)
			if(!A.ai_detector_visible)
				continue
			var/turf/detect_turf = get_turf(A)
			if(get_dist(our_turf, detect_turf) < rangealert)
				detect_state = PROXIMITY_ON_SCREEN
				break
			if(get_dist(our_turf, detect_turf) < rangewarning)
				detect_state = PROXIMITY_NEAR
				break

/mob/camera/ai_eye/remote/ai_detector
	name = "AI detector eye"
	ai_detector_visible = FALSE
	use_static = USE_STATIC_TRANSPARENT
	visible_icon = FALSE

/datum/action/item_action/toggle_multitool
	name = "Toggle AI detector HUD"
	check_flags = NONE

/datum/action/item_action/toggle_multitool/Trigger()
	if(!..())
		return 0
	if(target)
		var/obj/item/multitool/ai_detect/M = target
		M.toggle_hud(owner)
	return 1

/obj/item/multitool/abductor
	name = "alien multitool"
	desc = "An omni-technological interface."
	icon = 'icons/obj/abductor.dmi'
	icon_state = "multitool"
	toolspeed = 0.1

/obj/item/multitool/cyborg
	name = "electronic multitool"
	desc = "Optimised version of a regular multitool. Streamlines processes handled by its internal microchip."
	icon = 'icons/obj/items_cyborg.dmi'
	icon_state = "multitool_cyborg"
	toolspeed = 0.5
