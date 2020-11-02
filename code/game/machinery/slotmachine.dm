/*******************************\
|		  Slot Machines		  	|
|	  Original code by Glloyd	|
|	  Tgstation port by Miauw	|
\*******************************/

#define SPIN_PRICE 5
#define SMALL_PRIZE 400
#define BIG_PRIZE 1000
#define JACKPOT 10000
#define SPIN_TIME 65 //As always, deciseconds.
#define REEL_DEACTIVATE_DELAY 7
#define SEVEN "<font color='red'>7</font>"
#define HOLOCHIP 1
#define COIN 2


/datum/bank_account/slot_machine
	account_holder = "Slot Machine Personal Account"
	add_to_accounts = FALSE

/datum/asset/spritesheet/slot_machine
	name = "slot_machine"
	var/list/symbol_icon_info = list(
		list("icon" = 'icons/mob/gorilla.dmi', 		"icon_state" = "gorilla", 		"dir" = SOUTH, "frame" = 1),
		list("icon" = 'icons/mob/hivebot.dmi', 		"icon_state" = "basic", 		"dir" = SOUTH, "frame" = 1),
		list("icon" = 'icons/mob/gondolas.dmi', 	"icon_state" = "gondola",		"dir" = SOUTH, "frame" = 1),
		list("icon" = 'icons/mob/monkey.dmi',		"icon_state" = "monkey1",		"dir" = SOUTH, "frame" = 1),
		list("icon" = 'icons/mob/pets.dmi', 		"icon_state" = "corgi",			"dir" = SOUTH, "frame" = 1),
		list("icon" = 'icons/mob/pets.dmi', 		"icon_state" = "spacecat", 		"dir" = SOUTH, "frame" = 1),
		list("icon" = 'icons/mob/spacedragon.dmi', 	"icon_state" = "spacedragon", 	"dir" = SOUTH, "frame" = 1),
		list("icon" = 'icons/mob/jungle/mook.dmi', 	"icon_state" = "mook", 			"dir" = SOUTH, "frame" = 1),
	)
	// List of all keys in this sprite sheet
	var/list/index_to_name = null

/datum/asset/spritesheet/slot_machine/register()
	index_to_name = list()
	for(var/i in 1 to symbol_icon_info.len)
		var/list/L = symbol_icon_info[i]
		var/key_name = "M[i]"
		Insert(sprite_name = key_name, I = L["icon"], icon_state=L["icon_state"], dir=L["dir"], frame = L["frame"])
		index_to_name += key_name
	..()


/obj/machinery/computer/slot_machine
	name = "slot machine"
	desc = "Gambling for the antisocial."
	icon = 'icons/obj/economy.dmi'
	icon_state = "slots1"
	density = TRUE
	use_power = IDLE_POWER_USE
	idle_power_usage = 50
	circuit = /obj/item/circuitboard/computer/slot_machine
	light_color = LIGHT_COLOR_BROWN
	// These settings let you change the way the machine pays and plays
	var/number_of_reels = 3
	var/number_of_symbols = 8
	var/chance_of_winning_jackpot = 0 // caculated by "update_chance_of_winning"
	var/normal_game_price = 5	// 5 bucks a game hahaha
	/// Slot machine's bank account, this is a secret space swiss account
	/// the machine starts with.  Just so there is SOMETHING this thing
	/// can run off of because if we run this off the station budget all hell
	/// will break loose
	var/datum/bank_account/slot_machine/slot_account
	/// This account is somone who wants to run it themselves.  The slot_account
	/// still exists but is never used again once this is activated.  Only destroying
	/// the machine will reset it back to the slot account
	var/datum/bank_account/owner_account = null
	var/working = FALSE
	// fake numbers, to get the mark to just BEEEELEAVE
	var/money_consumed = 0
	var/total_money_won = 0
	var/total_plays = 0
	var/major_jackpots_won = 0
	var/minor_jackpots_won = 0
	var/major_jackpots_money_given = 0
	var/minor_jackpots_money_given = 0
	// these are the REAL numbers
	var/real_money_consumed = 0
	var/real_total_money_won = 0
	var/real_total_plays = 0
	var/real_major_jackpots_won = 0
	var/real_minor_jackpots_won = 0
	var/real_major_jackpots_money_given = 0
	var/real_minor_jackpots_money_given = 0

	// the sprite sheet of all the created icon info
	var/static/datum/asset/spritesheet = null
	// Associated list of the filename and state
	// If you want an image as a symbol it must be put in here FIRST as the sprite sheet is generated on startup here

	// this is the loaded symbols for this machine.  Its a list of sprite sheet names
	var/list/symbols = null
	// reals is a 2d list of what the physical machine looks like
	var/list/reels = null
	// The position of where the wheel is looking at.  This is the dead center of the screen
	var/list/real_indics = null
	//var/list/symbols = list(SEVEN = 1, "<font color='orange'>&</font>" = 2, "<font color='yellow'>@</font>" = 2, "<font color='green'>$</font>" = 2, "<font color='blue'>?</font>" = 2, "<font color='grey'>#</font>" = 2, "<font color='white'>!</font>" = 2, "<font color='fuchsia'>%</font>" = 2)


	//if people are winning too much, multiply every number in this list by 2 and see if they are still winning too much.
	var/obj/item/card/id/money_card = null // Just has to be an id with a bank account
	// current balance being used in the machine
	var/balance = 0

/obj/machinery/computer/slot_machine/Initialize()
	. = ..()

	/// Create falls hope protocol
	total_plays = rand(321, 4212) //false hope
	money_consumed = normal_game_price * total_plays
	total_money_won = round(rand(money_consumed/4,total_money_won)) // yeeesss give them hooope
	major_jackpots_won = round(total_plays/4)  // 1 in 4 wins...its a sure thing!
	minor_jackpots_won = rand(1,5)		// someone has ALWAYS won atleast once hahaha
	major_jackpots_money_given = minor_jackpots_won * rand(5000,50000) // GO FOR BROKE!
	minor_jackpots_money_given = total_money_won/3  		// none of these numbers matter!
	// falls hope...complete!

	// Set up accounts
	slot_account = new
	owner_account = slot_account

	load_symbols()
	create_reels()
	update_chance_of_winning()
	reset_play_stats()

/obj/machinery/computer/slot_machine/proc/reset_play_stats()
	real_money_consumed = 0
	real_total_money_won = 0
	real_total_plays = 0
	real_major_jackpots_won = 0
	real_minor_jackpots_won = 0
	real_major_jackpots_money_given = 0
	real_minor_jackpots_money_given = 0

// machine startup procs
/obj/machinery/computer/slot_machine/proc/create_reels()
	reels = list() // delete the existing list
	#if 0
	if(loaded_symbols.len < number_of_symbols)
		log_runtime("Number of symbols ([number_of_symbols]) more than we have on the sheet!")
		number_of_symbols = loaded_symbols.len

	reels = list() // delete the existing list
	real_indics = list(number_of_reels)
	var/list/real
	for(var/i in 1 to number_of_reels)
		var/list/real = list(number_of_symbols)
		reels += list(real)
		for(var/j in 1 to number_of_symbols)
			real[j] = loaded_symbols[j]
		real_indics[i] = rand(1, number_of_symbols) // set a random position
	// set the indices
#endif

/obj/machinery/computer/slot_machine/proc/load_symbols()
	var/datum/asset/spritesheet/slot_machine/sheet = get_asset_datum(/datum/asset/spritesheet/slot_machine)
	symbols = sheet.index_to_name.Copy()

/obj/machinery/computer/slot_machine/proc/update_chance_of_winning()
	chance_of_winning_jackpot = 1/(number_of_reels**number_of_symbols)

// Card Procs
/obj/machinery/computer/slot_machine/proc/id_insert(mob/user, obj/item/inserting_item, obj/item/target)
	var/obj/item/card/id/card_to_insert = inserting_item
	var/holder_item = FALSE

	if(!isidcard(card_to_insert))
		card_to_insert = inserting_item.RemoveID()
		holder_item = TRUE

	if(!card_to_insert || !user.transferItemToLoc(card_to_insert, src))
		return FALSE

	if(target)
		if(holder_item && inserting_item.InsertID(target))
			playsound(src, 'sound/machines/terminal_insert_disc.ogg', 50, FALSE)
		else
			id_eject(user, target)

	user.visible_message("<span class='notice'>[user] inserts \the [card_to_insert] into \the [src].</span>",
						"<span class='notice'>You insert \the [card_to_insert] into \the [src].</span>")
	playsound(src, 'sound/machines/terminal_insert_disc.ogg', 50, FALSE)
	updateUsrDialog()
	return TRUE

/obj/machinery/computer/slot_machine/proc/id_eject(mob/user, obj/target)
	if(!target)
		to_chat(user, "<span class='warning'>That card slot is empty!</span>")
		return FALSE
	else
		try_put_in_hand(target, user)
		user.visible_message("<span class='notice'>[user] gets \the [target] from \the [src].</span>", \
							"<span class='notice'>You get \the [target] from \the [src].</span>")
		playsound(src, 'sound/machines/terminal_insert_disc.ogg', 50, FALSE)
		updateUsrDialog()
		return TRUE

/obj/machinery/computer/slot_machine/AltClick(mob/user)
	..()
	if(!user.canUseTopic(src, !issilicon(user)) || !is_operational)
		return
	if(money_card)
		if(id_eject(user, money_card))
			money_card = null
			updateUsrDialog()

/obj/machinery/computer/slot_machine/on_deconstruction()
	if(money_card)
		money_card.forceMove(drop_location())
		money_card = null
	. = ..()


/obj/machinery/computer/slot_machine/examine(mob/user)
	. = ..()
	if(money_card)
		. += "<span class='notice'>Alt-click to eject the ID card.</span>"


/obj/machinery/computer/slot_machine/Destroy()
	if(istype(slot_account, /datum/bank_account/slot_machine))
		// the money in the slot machine just goes poof so people cannot just build and destroy these things
		// for free money
		QDEL_NULL(slot_account)

	return ..()

/obj/machinery/computer/slot_machine/process(delta_time)
	. = ..() //Sanity checks.
	if(!.)
		return .

	//money += round(delta_time / 2) //SPESSH MAJICKS
	//

/obj/machinery/computer/slot_machine/update_icon_state()
	if(machine_stat & NOPOWER)
		icon_state = "slots0"

	else if(machine_stat & BROKEN)
		icon_state = "slotsb"

	else if(working)
		icon_state = "slots2"

	else
		icon_state = "slots1"

/obj/machinery/computer/slot_machine/attackby(obj/item/O, mob/living/user, params)
	if(istype(O, /obj/item/holochip) || istype(O, /obj/item/stack/spacecash) || istype(O, /obj/item/coin))
		var/deposit_value = O.get_item_credit_value()
		balance += deposit_value
		qdel(O)
		say("Deposited [deposit_value] credits .")
		update_icon()
		return
	var/obj/item/card/id/new_acct = O.GetID()
	if(!new_acct)
		return ..()

	if(!new_acct.registered_account)
		to_chat(user, "<span class='warning'>The card has no bank account</span>")
		return

	if(panel_open)
		if(owner_account != slot_account)
			to_chat(user, "<span class='warning'>The machine account is already taken</span>")
			return
		owner_account = new_acct.registered_account
		to_chat(user, "<span class='warning'>The thee slot machine is now set to the account of [owner_account.account_holder]</span>")
	else
		if(id_insert(user, O, money_card))
			money_card = O
	updateUsrDialog()



/obj/machinery/computer/slot_machine/emag_act()
	if(obj_flags & EMAGGED)
		return
	obj_flags |= EMAGGED
	var/datum/effect_system/spark_spread/spark_system = new /datum/effect_system/spark_spread()
	spark_system.set_up(4, 0, src.loc)
	spark_system.start()
	playsound(src, "sparks", 50, TRUE, SHORT_RANGE_SOUND_EXTRARANGE)

/obj/machinery/computer/slot_machine/ui_interact(mob/living/user, datum/tgui/ui)
	ui = SStgui.try_update_ui(user, src, ui)
	if(!ui)
		ui = new(user, src, "SlotMachine")
		ui.open()

/obj/machinery/computer/slot_machine/ui_assets(mob/user)
	return list(
		get_asset_datum(/datum/asset/spritesheet/slot_machine)
	)
/obj/machinery/computer/slot_machine/ui_data(mob/user)
	. = list()

/obj/machinery/computer/slot_machine/ui_act(action, params,datum/tgui/ui)
	. = ..()
	if(.)
		return


#if 0
/obj/machinery/vending/ui_static_data(mob/user)
	. = list()
#endif



/obj/machinery/computer/slot_machine/emp_act(severity)
	. = ..()
	#if 0
	if(machine_stat & (NOPOWER|BROKEN) || . & EMP_PROTECT_SELF)
		return
	if(prob(15 * severity))
		return
	if(prob(1)) // :^)
		obj_flags |= EMAGGED
	var/severity_ascending = 4 - severity
	money = max(rand(money - (200 * severity_ascending), money + (200 * severity_ascending)), 0)
	balance = max(rand(balance - (50 * severity_ascending), balance + (50 * severity_ascending)), 0)
	money -= max(0, give_payout(min(rand(-50, 100 * severity_ascending)), money)) //This starts at -50 because it shouldn't always dispense coins yo
	spin()
#endif

/obj/machinery/computer/slot_machine/proc/spin(mob/user)
	if(!can_spin(user))
		return
#if 0
	var/the_name
	if(user)
		the_name = user.real_name
		visible_message("<span class='notice'>[user] pulls the lever and the slot machine starts spinning!</span>")
	else
		the_name = "Exaybachay"

	balance -= SPIN_PRICE
	money += SPIN_PRICE
	plays += 1
	working = TRUE

	toggle_reel_spin(1)
	update_icon()
	updateDialog()

	var/spin_loop = addtimer(CALLBACK(src, .proc/do_spin), 2, TIMER_LOOP|TIMER_STOPPABLE)

	addtimer(CALLBACK(src, .proc/finish_spinning, spin_loop, user, the_name), SPIN_TIME - (REEL_DEACTIVATE_DELAY * reels.len))
	//WARNING: no sanity checking for user since it's not needed and would complicate things (machine should still spin even if user is gone), be wary of this if you're changing this code.
#endif

/obj/machinery/computer/slot_machine/proc/do_spin()
	randomize_reels()
	updateDialog()

/obj/machinery/computer/slot_machine/proc/finish_spinning(spin_loop, mob/user, the_name)
	toggle_reel_spin(0, REEL_DEACTIVATE_DELAY)
	working = FALSE
	//deltimer(spin_loop)
	give_prizes(the_name, user)
	update_icon()
	updateDialog()

/obj/machinery/computer/slot_machine/proc/can_spin(mob/user)
	if(machine_stat & NOPOWER)
		to_chat(user, "<span class='warning'>The slot machine has no power!</span>")
		return FALSE
	if(machine_stat & BROKEN)
		to_chat(user, "<span class='warning'>The slot machine is broken!</span>")
		return FALSE
	if(working)
		to_chat(user, "<span class='warning'>You need to wait until the machine stops spinning before you can play again!</span>")
		return FALSE
	if(balance < SPIN_PRICE)
		to_chat(user, "<span class='warning'>Insufficient money to play!</span>")
		return FALSE
	return TRUE

/obj/machinery/computer/slot_machine/proc/toggle_reel_spin(value, delay = 0) //value is 1 or 0 aka on or off
	for(var/list/reel in reels)
		reels[reel] = value
		sleep(delay)

/obj/machinery/computer/slot_machine/proc/randomize_reels()

	for(var/reel in reels)
		if(reels[reel])
			reel[3] = reel[2]
			reel[2] = reel[1]
			reel[1] = pick(symbols)

/obj/machinery/computer/slot_machine/proc/give_prizes(usrname, mob/user)
#if 0
	var/linelength = get_lines()

	if(reels[1][2] + reels[2][2] + reels[3][2] + reels[4][2] + reels[5][2] == "[SEVEN][SEVEN][SEVEN][SEVEN][SEVEN]")
		visible_message("<b>[src]</b> says, 'JACKPOT! You win [money] credits!'")
		priority_announce("Congratulations to [user ? user.real_name : usrname] for winning the jackpot at the slot machine in [get_area(src)]!")
		jackpots += 1
		balance += money - give_payout(JACKPOT)
		money = 0
		if(paymode == HOLOCHIP)
			new /obj/item/holochip(loc,JACKPOT)
		else
			for(var/i = 0, i < 5, i++)
				cointype = pick(subtypesof(/obj/item/coin))
				var/obj/item/coin/C = new cointype(loc)
				random_step(C, 2, 50)

	else if(linelength == 5)
		visible_message("<b>[src]</b> says, 'Big Winner! You win a thousand credits!'")
		give_money(BIG_PRIZE)

	else if(linelength == 4)
		visible_message("<b>[src]</b> says, 'Winner! You win four hundred credits!'")
		give_money(SMALL_PRIZE)

	else if(linelength == 3)
		to_chat(user, "<span class='notice'>You win three free games!</span>")
		balance += SPIN_PRICE * 4
		money = max(money - SPIN_PRICE * 4, money)

	else
		to_chat(user, "<span class='warning'>No luck!</span>")
#endif
/obj/machinery/computer/slot_machine/proc/get_lines()
#if 0
	var/amountthesame

	for(var/i = 1, i <= 3, i++)
		var/inputtext = reels[1][i] + reels[2][i] + reels[3][i] + reels[4][i] + reels[5][i]
		for(var/symbol in symbols)
			var/j = 3 //The lowest value we have to check for.
			var/symboltext = symbol + symbol + symbol
			while(j <= 5)
				if(findtext(inputtext, symboltext))
					amountthesame = max(j, amountthesame)
				j++
				symboltext += symbol

			if(amountthesame)
				break

	return amountthesame
#endif
/obj/machinery/computer/slot_machine/proc/give_money(amount)
#if 0
	var/amount_to_give = money >= amount ? amount : money
	var/surplus = amount_to_give - give_payout(amount_to_give)
	money = max(0, money - amount)
	balance += surplus
#endif

/obj/machinery/computer/slot_machine/proc/give_payout(amount)
#if 0
	if(paymode == HOLOCHIP)
		cointype = /obj/item/holochip
	else
		cointype = obj_flags & EMAGGED ? /obj/item/coin/iron : /obj/item/coin/silver

	if(!(obj_flags & EMAGGED))
		amount = dispense(amount, cointype, null, 0)

	else
		var/mob/living/target = locate() in range(2, src)

		amount = dispense(amount, cointype, target, 1)

	return amount

#endif
#undef SEVEN
#undef SPIN_TIME
#undef JACKPOT
#undef BIG_PRIZE
#undef SMALL_PRIZE
#undef SPIN_PRICE
#undef HOLOCHIP
#undef COIN
