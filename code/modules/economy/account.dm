#define DUMPTIME 3000

/datum/bank_account
	var/account_holder = "Rusty Venture"
	var/account_balance = 0
	var/payday_modifier
	var/datum/job/account_job
	var/list/bank_cards = list()
	var/add_to_accounts = TRUE
	var/account_id
	var/being_dumped = FALSE //pink levels are rising
	var/datum/bounty/civilian_bounty
	var/bounty_timer = 0

/datum/bank_account/New(newname, job, modifier = 1)
	if(newname)
		account_holder = newname
	if(job)
		account_job = job
	payday_modifier = modifier
	setup_unique_account_id()

/datum/bank_account/Destroy()
	if(add_to_accounts)
		SSeconomy.bank_accounts_by_id -= "[account_id]"
	return ..()

/// Proc guarantees the account_id possesses a unique number. If it doesn't, it tries to find a unique alternative. It then adds it to the `SSeconomy.bank_accounts_by_id` global list.
/datum/bank_account/proc/setup_unique_account_id()
	var/start_number
	if(!account_id)
		account_id = start_number = rand(BANK_ACCOUNT_NUMBER_BEGIN, BANK_ACCOUNT_NUMBER_END)
	else
		start_number = account_id
	while(SSeconomy.bank_accounts_by_id["[account_id]"])
		account_id++
		if(account_id > BANK_ACCOUNT_NUMBER_END)
			account_id = BANK_ACCOUNT_NUMBER_BEGIN
		if(account_id == start_number)
			stack_trace("...Seriously this isn't possible.  I know we get allot of players but this is crazy")

	SSeconomy.bank_accounts_by_id["[account_id]"] = add_to_accounts ? src : new/datum/bank_account/dummmy(src)

/datum/bank_account/vv_edit_var(var_name, var_value) // just so you don't have to do it manually
	var/old_id = account_id
	var/datum/bank_account/old_account = SSeconomy.bank_accounts_by_id["[account_id]"]
	. = ..()
	switch(var_name)
		if(NAMEOF(src, account_id))
			if(add_to_accounts)
				SSeconomy.bank_accounts_by_id -= "[old_id]"
				setup_unique_account_id()
		if(NAMEOF(src, add_to_accounts))
			if(istype(old_account, /datum/bank_account/dummmy))
				QDEL_NULL(old_account)
			SSeconomy.bank_accounts_by_id.Remove("[account_id]")
			setup_unique_account_id()


/datum/bank_account/proc/dumpeet()
	being_dumped = TRUE

/datum/bank_account/proc/_adjust_money(amt)
	account_balance += amt
	if(account_balance < 0)
		account_balance = 0

/datum/bank_account/proc/has_money(amt)
	return account_balance >= amt

/datum/bank_account/proc/adjust_money(amt)
	if((amt < 0 && has_money(-amt)) || amt > 0)
		_adjust_money(amt)
		return TRUE
	return FALSE

/datum/bank_account/proc/transfer_money(datum/bank_account/from, amount)
	if(from.has_money(amount))
		adjust_money(amount)
		SSblackbox.record_feedback("amount", "credits_transferred", amount)
		log_econ("[amount] credits were transferred from [from.account_holder]'s account to [src.account_holder]")
		from.adjust_money(-amount)
		return TRUE
	return FALSE

/datum/bank_account/proc/payday(amt_of_paychecks, free = FALSE)
	if(!account_job)
		return
	var/money_to_transfer = account_job.paycheck * payday_modifier * amt_of_paychecks
	if(free)
		adjust_money(money_to_transfer)
		SSblackbox.record_feedback("amount", "free_income", money_to_transfer)
		SSeconomy.station_target += money_to_transfer
		log_econ("[money_to_transfer] credits were given to [src.account_holder]'s account from income.")
	else
		var/datum/bank_account/D = SSeconomy.get_dep_account(account_job.paycheck_department)
		if(D)
			if(!transfer_money(D, money_to_transfer))
				bank_card_talk("ERROR: Payday aborted, departmental funds insufficient.")
				return FALSE
			else
				bank_card_talk("Payday processed, account now holds [account_balance] cr.")
				return TRUE
	bank_card_talk("ERROR: Payday aborted, unable to contact departmental account.")
	return FALSE

/datum/bank_account/proc/bank_card_talk(message, force)
	if(!message || !bank_cards.len)
		return
	for(var/obj/A in bank_cards)
		var/icon_source = A
		if(istype(A, /obj/item/card/id))
			var/obj/item/card/id/id_card = A
			if(id_card.uses_overlays)
				icon_source = id_card.get_cached_flat_icon()
		var/mob/card_holder = recursive_loc_check(A, /mob)
		if(ismob(card_holder)) //If on a mob
			if(!card_holder.client || (!(card_holder.client.prefs.chat_toggles & CHAT_BANKCARD) && !force))
				return

			if(card_holder.can_hear())
				card_holder.playsound_local(get_turf(card_holder), 'sound/machines/twobeep_high.ogg', 50, TRUE)
				to_chat(card_holder, "[icon2html(icon_source, card_holder)] <span class='notice'>[message]</span>")
		else if(isturf(A.loc)) //If on the ground
			var/turf/T = A.loc
			for(var/mob/M in hearers(1,T))
				if(!M.client || (!(M.client.prefs.chat_toggles & CHAT_BANKCARD) && !force))
					continue
				if(M.can_hear())
					M.playsound_local(T, 'sound/machines/twobeep_high.ogg', 50, TRUE)
					to_chat(M, "[icon2html(icon_source, M)] <span class='notice'>[message]</span>")
		else
			var/atom/sound_atom
			for(var/mob/M in A.loc) //If inside a container with other mobs (e.g. locker)
				if(!M.client || (!(M.client.prefs.chat_toggles & CHAT_BANKCARD) && !force))
					continue
				if(!sound_atom)
					sound_atom = A.drop_location() //in case we're inside a bodybag in a crate or something. doing this here to only process it if there's a valid mob who can hear the sound.
				if(M.can_hear())
					M.playsound_local(get_turf(sound_atom), 'sound/machines/twobeep_high.ogg', 50, TRUE)
					to_chat(M, "[icon2html(icon_source, M)] <span class='notice'>[message]</span>")

/**
  * Returns a string with the civilian bounty's description on it.
  */
/datum/bank_account/proc/bounty_text()
	if(!civilian_bounty)
		return FALSE
	return civilian_bounty.description


/**
  * Returns the required item count, or required chemical units required to submit a bounty.
  */
/datum/bank_account/proc/bounty_num()
	if(!civilian_bounty)
		return FALSE
	if(istype(civilian_bounty, /datum/bounty/item))
		var/datum/bounty/item/item = civilian_bounty
		return "[item.shipped_count]/[item.required_count]"
	if(istype(civilian_bounty, /datum/bounty/reagent))
		var/datum/bounty/reagent/chemical = civilian_bounty
		return "[chemical.shipped_volume]/[chemical.required_volume] u"
	if(istype(civilian_bounty, /datum/bounty/virus))
		return "At least 1u"

/**
  * Produces the value of the account's civilian bounty reward, if able.
  */
/datum/bank_account/proc/bounty_value()
	if(!civilian_bounty)
		return FALSE
	return civilian_bounty.reward

/**
  * Performs house-cleaning on variables when a civilian bounty is replaced, or, when a bounty is claimed.
  */
/datum/bank_account/proc/reset_bounty()
	civilian_bounty = null
	bounty_timer = 0

/datum/bank_account/department
	account_holder = "Guild Credit Agency"
	var/department_id = "REPLACE_ME"
	add_to_accounts = FALSE

/datum/bank_account/department/New(dep_id, budget)
	department_id = dep_id
	account_balance = budget
	account_holder = SSeconomy.department_accounts[dep_id]
	SSeconomy.generated_accounts += src

/datum/bank_account/remote // Bank account not belonging to the local station
	add_to_accounts = FALSE

/datum/bank_account/dummmy // Bank account that exists JUST so that account number doesn't take up space
	account_holder = "Dummmy Shell Account"
	var/datum/bank_account/parent = null

/datum/bank_account/dummmy/New(datum/bank_account/P)
	parent = P
	account_id = P.account_id
	account_balance = 0 // and we have no money
	RegisterSignal(P, COMSIG_PARENT_QDELETING, .proc/Destroy)
	return ..(P.account_holder, null, 1) // the rest is same but we don't get any money from payday

/datum/bank_account/dummmy/vv_edit_var(var_name, var_value) // just so you don't have to do it manually
	. = ..()
	switch(var_name)
		if(NAMEOF(src, account_id),NAMEOF(src, add_to_accounts), NAMEOF(src, parent))
			return FALSE // there is no reason for an admin to fuck with this, find the base object


/datum/bank_account/dummmy/Destroy()
	parent = null
	return ..()

#undef DUMPTIME
