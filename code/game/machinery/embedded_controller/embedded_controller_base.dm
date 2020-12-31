/*
 * Ok som history.  Originaly we had something called
 * /datum/computer/file/embedded_program.  I beleve it was for
 * abstraction when we had circuits in.  All well and good
 * but makes things messy for simple buttons..airlock controlers
 * and a shit ton more stuff.  So I striped it, and put it all
 * into the embedded_controller base with tgui
*/

/obj/machinery/embedded_controller
	var/datum/computer/file/embedded_program/program

	name = "embedded controller"
	density = FALSE

	var/on = TRUE

/obj/machinery/embedded_controller/ui_interact(mob/user)
	. = ..()
	user.set_machine(src)
	var/datum/browser/popup = new(user, "computer", name) // Set up the popup browser window
	popup.set_content(return_text())
	popup.open()

/obj/machinery/embedded_controller/proc/return_text()

/obj/machinery/embedded_controller/proc/post_signal(datum/signal/signal, comm_line)
	return

/obj/machinery/embedded_controller/receive_signal(datum/signal/signal)
	if(istype(signal) && program)
		program.receive_signal(signal)

/obj/machinery/embedded_controller/Topic(href, href_list)
	. = ..()
	if(.)
		return

	if(program)
		program.receive_user_command(href_list["command"])
		addtimer(CALLBACK(program, /datum/computer/file/embedded_program.proc/process), 5)

	usr.set_machine(src)
	addtimer(CALLBACK(src, .proc/updateDialog), 5)

/obj/machinery/embedded_controller/process(delta_time)
	if(program)
		program.process(delta_time)

	update_icon()
	src.updateDialog()

/obj/machinery/embedded_controller/radio
	var/frequency
	var/datum/radio_frequency/radio_connection

/obj/machinery/embedded_controller/radio/Destroy()
	SSradio.remove_object(src,frequency)
	return ..()

/obj/machinery/embedded_controller/radio/Initialize()
	. = ..()
	set_frequency(frequency)

/obj/machinery/embedded_controller/radio/post_signal(datum/signal/signal)
	signal.transmission_method = TRANSMISSION_RADIO
	if(radio_connection)
		return radio_connection.post_signal(src, signal)
	else
		signal = null

/obj/machinery/embedded_controller/radio/proc/set_frequency(new_frequency)
	SSradio.remove_object(src, frequency)
	frequency = new_frequency
	radio_connection = SSradio.add_object(src, frequency)
