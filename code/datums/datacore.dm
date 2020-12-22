//TODO: someone please get rid of this shit
// Your  wish is my command
#define DATACORE_FILENAME 'datacore.db'

/datum/datacore
	var/locked = FALSE // used to stop race conditions?
	var/list/record_log = list()

/datum/datacore/proc/CreateRecord(mob/user, record_name, list/row)
/datum/datacore/proc/UpdateRecord(mob/user, record_name, rec_id, list/row)
/datum/datacore/proc/DeleteRecord(mob/user, record_name, rec_id, mob/user)
/datum/datacore/proc/FindRecord(mob/user, record_name, find_list_or_id)


/datum/datacore/table
	var/list/VDB = null // virtual DB, in case we don't want to use DB
	var/list/record_cache = null

/datum/datacore/table/New()
	record_cache = list()
	VDB = list()
	var/list/L
	for(var/datum/record/R in typesof(datum/record/R))
		var/table_name = initial(R.table_name)
		var/auto_increment = initial(R.auto_increment)
		record_cache[table_name] = R
		L = list()
		VDB[table_name] = L
		if(isnum(auto_increment))
			L["@auto_increment"] = auto_increment // special var to keep track of the number
		VDB[initial(R.table_name)] = L


/datum/datacore/table/CreateRecord(mob/user, record_name, list/row_data)
	var/datum/record/R = record_cache[record_name]
	// we don't check if the lists exists, it was already checked
	var/primary_key = initial(R.primary_key)
	var/table_name = initial(R.table_name)
	var/list/fields = initial(R.fields)
	var/auto_increment = initial(R.auto_increment)

	var/list/table = VDB[table_name]
	var/list/nrow = list() // clean the row so it only contains fields we want
	for(var/field_name in fields)
		var/value = row_data[field_name]
		nrow[field_name] = value
	if(primary_key)
		if(auto_increment)
			var/num = table["@auto_increment"]++
			nrow[primary_key] = num
			primary_key = "[num]" // I hate how lists work in byond
		table[primary_key] = nrow
	else
		table += list(nrow)
	if(user)
		record_log += list(list("user" = user.name, "record" = R, "action" = "insert", "data" = row_data))
	return TRUE

// only works if we have a primary_key
/datum/datacore/table/UpdateRecord(mob/user, record_name, rec_id, list/row_data)
	var/datum/record/R = record_cache[record_name]
	var/primary_key = initial(R.primary_key)
	if(!primary_key)
		return FALSE // no update
	var/table_name = initial(R.table_name)
	var/list/fields = initial(R.fields)

	// we don't check if the lists exists, it was already checked
	var/list/table = VDB[table_name]
	if(isnum(rec_id))
		rec_id = "[rec_id]"
	var/list/old_row = table[rec_id]
	if(!old_row)
		return FALSE // row does not exist, never created
	for(var/field_name in row_data)
		if(!fields[field_name] )
			continue // if its a field not in the record skip
		var/value = row_data[field_name]
		old_row[field_name] = value
	if(user)
		record_log += list(list("user" = user.name, "record" = R, "rec_id" =rec_id,  "action" = "update", "data" = row_data))
	return old_row // returning this might be a bad idea

/datum/datacore/table/DeleteRecord(mob/user,record_name, rec_id)
	var/datum/record/R = record_cache[record_name]
	var/primary_key = initial(R.primary_key)
	if(!primary_key)
		return null // no delete
	var/table_name = initial(R.table_name)
	var/list/fields = initial(R.fields)

		// we don't check if the lists exists, it was already checked
	var/list/table = VDB[table_name]
	if(isnum(rec_id))
		rec_id = "[rec_id]"
	var/list/old_row = table[rec_id] // clean the row so it only contains fields we want
	if(old_row) // row does not exist, so just return true?
		table[rec_id] = null
		table.Remove(rec_id) // really make sure its gone
	if(user)
		record_log += list(list("user" = user.name, "record" = R, "rec_id" =rec_id,  "action" = "delete"))
	return old_row

/datum/datacore/table/FindRecord(mob/user, record_name, find_list_or_id=null)
	var/datum/record/R = record_cache[record_name]
	var/primary_key = initial(R.primary_key)
	var/table_name = initial(R.table_name)
	var/list/table = VDB[table_name]
	if(isnull(find_list_or_id))
		return table // just return it all
	else if(primary_key)
		if(istext(find_list_or_id))
			return table[find_list_or_id]
		else if(isnum(find_list_or_id))
			return table["[find_list_or_id]"]
		else if(islist(find_list_or_id) && find_list_or_id[primary_key])
			var/list/row = FindRecord(user,R, primary_key)  // recursive call vs full binary search
			if(row[primary_key] == find_list_or_id[primary_key])
				return row
	else if(islist(find_list_or_id)) 	// if its not a list, then..what are you doing?
		// this is an assocated list where field=value
		var/list/rows = list()
		var/list/entry
		for(var/i in 1 to table.len)
			entry = table[i]
			for(var/field_name in find_list_or_id) // have to search them all...linearly
				var/field_value = find_list_or_id[field_name]
				if(entry[field_name] != field_value)
					entry = null
					break
			if(!entry)
				continue
			rows += list(entry)
		if(rows.len >0)
			return rows
	return null // return false


#if 0
// lets not deal with sql quite yet ugg
/datum/datacore/sql
	var/datacore_filename = null
	var/database/DB = null
	var/list/query_cache = list()


/datum/datacore/sql/New()
	datacore_filename = "datacore_[GLOB.round_id].db"
	DB = database/new(datacore_filename)

/datum/datacore/proc/_BuildQueryCache(datum/record/R)
	var/list/rec_cache = list()
	var/list/buf1 = list()
	var/list/buf2 = list()
	var/comma = FALSE
	// Insert string cache	var/table_name = initial(R.table_name)
	var/table_name = initial(R.table_name)
	var/list/fields = initial(R.fields)
	buf1 += "INSERT INTO"
	buf1 += " [table_name] ("//   [GLOB.round_id])
	for(var/field_name in fields)
		var/value = row_data[field_name]
		if(comma)
			buf1 += ",[field_name]"
			buf2 += ",?"
		else
			buf1 += "[field_name]"
			buf2 += "?"
		comma = TRUE
	buf1 += ") VALUES ("
	buf1 += buf2.Join()
	buf1 += ")"
	rec_cache["INSERT"] = buf1.Join() // Insert into record


/datum/datacore/proc/CheckRecord(datum/record/R)
	 new("SELECT name FROM sqlite_master WHERE type='table' AND name=?", initial(R.table_name)) // SELECT quest,complete FROM quests WHERE name=?", usr.key)
	if(!q.Execute(DB)) // the master table dosn't exist, so we need to make one
		var/list/buf = list()
		buf += "CREATE TABLE "
		buf += table_name
		buf += "(" // need this with different rounds we get
		var/list/fields = initial(R.fields)
		for(var/field_name in R.fields)
			var/field_type = fields[field_name]
			buf += ", [field_name] [field_type]"
		buf += ", PRIMARY KEY(RoundId"
		if(initial(R.primary_key))
			buf += ",[primary_key]"
		buf += "))"
		q = new(buf.Join())
#ifdef TESTING
		if(!q.Execute(DB))
			testing("table [table_name] could not be created? [q.ErrorMsg()]")
#else
		q.Execute(DB)
#endif


/datum/datacore/sql/InsertRecord(datum/record/R, list/row)
	var/q_text = list_query_cache[ispath(R) ? R : R.type]
	if(!q)
		_BuildQueryCache(R)


	var/list/qbuf = list()
	var/list/vbuf = list()
	qbuf += "INSERT INTO [table_name] (RoundID"//   [GLOB.round_id])
	for(var/field_name in fields)
		var/value = row_data[field_name]
		qbuf += ",[field_name]"
		vbuf += ",[value]"
	qbuf += ") VALUES ([GLOB.round_id]"
	qbuf += vbuf.Join()
	qbuf += ")"
	var/database/query/q = new(qbuf.Join())
#ifdef TESTING
	if(!q.Execute(DB))
			testing("row to table [table_name] could not be inserted")
#else
	q.Execute(DB)
#endif


// only works if we have a primary_key
/datum/datacore/sql/UpdateRecord(datum/record/R, list/row)
	var/primary_key = initial(R.primary_key)
	if(!primary_key)
		return null // no update
	var/table_name = initial(R.table_name)
	var/list/fields = initial(R.fields)

	var/list/qbuf = list()
	var/list/vbuf = list()
	qbuf += "UPDATE SET [table_name] (RoundID"//   [GLOB.round_id])
	for(var/field_name in fields)
		var/value = row_data[field_name]
		qbuf += ",[field_name]"
		vbuf += ",[value]"
	qbuf += ") VALUES ([GLOB.round_id]"
	qbuf += vbuf.Join()
	qbuf += ")"
	var/database/query/q = new(qbuf.Join())
#ifdef TESTING
	if(!q.Execute(DB))
			testing("row to table [table_name] could not be inserted")
#else
	q.Execute(DB)
#endif


//	DB.Add("SELECT name FROM sqlite_master WHERE type='table' AND name='{ss13_master}')
#endif

/datum/record
	// name of the table
	var/table_name = null
	// if we have a primary key use this
	var/primary_key = null
	// primary key is an auto increment
	var/auto_increment = null
	// fields are fields and types in an assocated array
	// byond sqlite only has TEXT, INTEGER, FLOAT, BLOB (icons)
	var/list/fields = null

#define RECORD_TYPE_TEXT "TEXT"
#define RECORD_TYPE_BOOL "INTEGER"
#define RECORD_TYPE_FLOAT "FLOAT"
#define RECORD_TYPE_INT "INTEGER"
#define RECORD_TYPE_BLOB "BLOB"
#define RECORD_TYPE_ICON "BLOB"

/datum/record/crime
	table_name = "crime"
	primary_key = "crime_id"
	auto_increment = TRUE
	fields = list(
		"name" = RECORD_TYPE_TEXT,
		"details" = RECORD_TYPE_TEXT,
		"author" = RECORD_TYPE_TEXT,
		"time" = RECORD_TYPE_TEXT,
		"fine" = RECORD_TYPE_FLOAT,
		"paid" = RECORD_TYPE_INT.
		"criminal_id" = RECORD_TYPE_INT,
		"crime_id" = RECORD_TYPE_INT,
	)

// general record
/datum/record/general
	table_name = "general"
	primary_key = "id"
	auto_increment = 1001
	fields = list(
		"id" = RECORD_TYPE_INT,
		"name" = RECORD_TYPE_TEXT,
		"rank" = RECORD_TYPE_TEXT,
		"age" = RECORD_TYPE_INT,
		"species" = RECORD_TYPE_TEXT,
		"p_stat" = RECORD_TYPE_TEXT.
		"m_stat" = RECORD_TYPE_TEXT,
		"gender" = RECORD_TYPE_TEXT,
		"photo_front" = RECORDS_TYPE_ICON,
		"photo_side" = RECORDS_TYPE_ICON,
	)

//Medical Record
/datum/record/medical
	table_name = "medical"
	primary_key = "id"
	fields = list(
		"id" = RECORD_TYPE_INT,
		"blood_type" = RECORD_TYPE_TEXT,
		"b_dna" = RECORD_TYPE_TEXT,
		"mi_dis" = RECORD_TYPE_TEXT,
		"mi_dis_d" = RECORD_TYPE_TEXT,
		"ma_dis_d" = RECORD_TYPE_TEXT.
		"ma_dis_d" = RECORD_TYPE_TEXT,
		"cdi" = RECORD_TYPE_TEXT,
		"cdi_d" = RECORD_TYPE_TEXT,
		"notes" = RECORD_TYPE_TEXT,
		"notes_d" = RECORD_TYPE_TEXT,
	)

//Citations a person gets Record
/datum/record/security
	table_name = "citation"
	primary_key = "id"
		fields = list(
		"id" = RECORD_TYPE_INT,
		"crime_id" = RECORD_TYPE_INT,
	)

//Security Record
/datum/record/security
	table_name = "security"
	primary_key = "id"
	fields = list(
		"id" = RECORD_TYPE_INT,
		"criminal" = RECORD_TYPE_TEXT,
		"citation_count" = RECORD_TYPE_TEXT,
		"notes" = RECORD_TYPE_TEXT,
	)

//locked record, not sure why we need this its all in H anyway
/datum/record/locked
	table_name = "locked"
	primary_key = "id"
	fields = list(
		"id" = RECORD_TYPE_INT,
		"name" = RECORD_TYPE_TEXT,
		"rank" = RECORD_TYPE_TEXT,
		"age" = RECORD_TYPE_TEXT,
		"gender" = RECORD_TYPE_TEXT,
		"blood_type" = RECORD_TYPE_TEXT,
		"b_dna" = RECORD_TYPE_TEXT,
		"identity" = RECORD_TYPE_TEXT,
		"species" = RECORD_TYPE_TEXT,
		"features" = RECORD_TYPE_TEXT,
		"image" = RECORD_TYPE_ICON,
		"mindref" = RECORD_TYPE_TEXT,
	)

#if 0
/datum/data/crime
	name = "crime"
	var/crimeName = ""
	var/crimeDetails = ""
	var/author = ""
	var/time = ""
	var/fine = 0
	var/paid = 0
	var/dataId = 0

/proc/createCrimeEntry(cname = "", cdetails = "", author = "", time = "", fine = 0)
	var/datum/data/crime/c = new /datum/data/crime
	c.crimeName = cname
	c.crimeDetails = cdetails
	c.author = author
	c.time = time
	c.fine = fine
	c.paid = 0
	c.dataId = ++securityCrimeCounter
	return c

/datum/datacore/proc/addCitation(id = "", datum/data/crime/crime)
	for(var/datum/data/record/R in security)
		if(R.fields["id"] == id)
			var/list/crimes = R.fields["citation"]
			crimes |= crime
			return

/datum/datacore/proc/removeCitation(id, cDataId)
	for(var/datum/data/record/R in security)
		if(R.fields["id"] == id)
			var/list/crimes = R.fields["citation"]
			for(var/datum/data/crime/crime in crimes)
				if(crime.dataId == text2num(cDataId))
					crimes -= crime
					return

/datum/datacore/proc/payCitation(id, cDataId, amount)
	for(var/datum/data/record/R in security)
		if(R.fields["id"] == id)
			var/list/crimes = R.fields["citation"]
			for(var/datum/data/crime/crime in crimes)
				if(crime.dataId == text2num(cDataId))
					crime.paid = crime.paid + amount
					var/datum/bank_account/D = SSeconomy.get_dep_account(ACCOUNT_SEC)
					D.adjust_money(amount)
					return

/**
  * Adds crime to security record.
  *
  * Is used to add single crime to someone's security record.
  * Arguments:
  * * id - record id.
  * * datum/data/crime/crime - premade array containing every variable, usually created by createCrimeEntry.
  */
/datum/datacore/proc/addCrime(id = "", datum/data/crime/crime)
	for(var/datum/data/record/R in security)
		if(R.fields["id"] == id)
			var/list/crimes = R.fields["crim"]
			crimes |= crime
			return

/**
  * Deletes crime from security record.
  *
  * Is used to delete single crime to someone's security record.
  * Arguments:
  * * id - record id.
  * * cDataId - id of already existing crime.
  */
/datum/datacore/proc/removeCrime(id, cDataId)
	for(var/datum/data/record/R in security)
		if(R.fields["id"] == id)
			var/list/crimes = R.fields["crim"]
			for(var/datum/data/crime/crime in crimes)
				if(crime.dataId == text2num(cDataId))
					crimes -= crime
					return

/**
  * Adds details to a crime.
  *
  * Is used to add or replace details to already existing crime.
  * Arguments:
  * * id - record id.
  * * cDataId - id of already existing crime.
  * * details - data you want to add.
  */
/datum/datacore/proc/addCrimeDetails(id, cDataId, details)
	for(var/datum/data/record/R in security)
		if(R.fields["id"] == id)
			var/list/crimes = R.fields["crim"]
			for(var/datum/data/crime/crime in crimes)
				if(crime.dataId == text2num(cDataId))
					crime.crimeDetails = details
					return
#endif

/datum/datacore/proc/manifest()
	for(var/i in GLOB.new_player_list)
		var/mob/dead/new_player/N = i
		if(N.new_character)
			log_manifest(N.ckey,N.new_character.mind,N.new_character)
		if(ishuman(N.new_character))
			manifest_inject(N.new_character, N.client)
		CHECK_TICK

/datum/datacore/proc/manifest_modify(name, assignment)
	var/datum/data/record/foundrecord = find_record("name", name, GLOB.data_core.general)
	if(foundrecord)
		foundrecord.fields["rank"] = assignment

/datum/datacore/proc/get_manifest()
	var/list/manifest_out = list()
	var/list/departments = list(
		"Command" = GLOB.command_positions,
		"Security" = GLOB.security_positions,
		"Engineering" = GLOB.engineering_positions,
		"Medical" = GLOB.medical_positions,
		"Science" = GLOB.science_positions,
		"Supply" = GLOB.supply_positions,
		"Service" = GLOB.service_positions,
		"Silicon" = GLOB.nonhuman_positions
	)
	for(var/datum/data/record/t in GLOB.data_core.general)
		var/name = t.fields["name"]
		var/rank = t.fields["rank"]
		var/has_department = FALSE
		for(var/department in departments)
			var/list/jobs = departments[department]
			if(rank in jobs)
				if(!manifest_out[department])
					manifest_out[department] = list()
				manifest_out[department] += list(list(
					"name" = name,
					"rank" = rank
				))
				has_department = TRUE
				break
		if(!has_department)
			if(!manifest_out["Misc"])
				manifest_out["Misc"] = list()
			manifest_out["Misc"] += list(list(
				"name" = name,
				"rank" = rank
			))
	return manifest_out

/datum/datacore/proc/get_manifest_html(monochrome = FALSE)
	var/list/manifest = get_manifest()
	var/dat = {"
	<head><style>
		.manifest {border-collapse:collapse;}
		.manifest td, th {border:1px solid [monochrome?"black":"#DEF; background-color:white; color:black"]; padding:.25em}
		.manifest th {height: 2em; [monochrome?"border-top-width: 3px":"background-color: #48C; color:white"]}
		.manifest tr.head th { [monochrome?"border-top-width: 1px":"background-color: #488;"] }
		.manifest tr.alt td {[monochrome?"border-top-width: 2px":"background-color: #DEF"]}
	</style></head>
	<table class="manifest" width='350px'>
	<tr class='head'><th>Name</th><th>Rank</th></tr>
	"}
	for(var/department in manifest)
		var/list/entries = manifest[department]
		dat += "<tr><th colspan=3>[department]</th></tr>"
		//JUST
		var/even = FALSE
		for(var/entry in entries)
			var/list/entry_list = entry
			dat += "<tr[even ? " class='alt'" : ""]><td>[entry_list["name"]]</td><td>[entry_list["rank"]]</td></tr>"
			even = !even

	dat += "</table>"
	dat = replacetext(dat, "\n", "")
	dat = replacetext(dat, "\t", "")
	return dat


/datum/datacore/proc/manifest_inject(mob/living/carbon/human/H, client/C)
	set waitfor = FALSE
	var/database/query/Q =
	var/static/list/show_directions = list(SOUTH, WEST)
	if(H.mind && (H.mind.assigned_role != H.mind.special_role))
		var/assignment
		if(H.mind.assigned_role)
			assignment = H.mind.assigned_role
		else if(H.job)
			assignment = H.job
		else
			assignment = "Unassigned"

		var/static/record_id_num = 1001
		var/id = num2hex(record_id_num++,6)
		if(!C)
			C = H.client
		var/image = get_id_photo(H, C, show_directions)
		var/datum/picture/pf = new
		var/datum/picture/ps = new
		pf.picture_name = "[H]"
		ps.picture_name = "[H]"
		pf.picture_desc = "This is [H]."
		ps.picture_desc = "This is [H]."
		pf.picture_image = icon(image, dir = SOUTH)
		ps.picture_image = icon(image, dir = WEST)
		var/obj/item/photo/photo_front = new(null, pf)
		var/obj/item/photo/photo_side = new(null, ps)

		//These records should ~really~ be merged or something
		//General Record
		var/datum/data/record/G = new()
		G.fields["id"]			= id
		G.fields["name"]		= H.real_name
		G.fields["rank"]		= assignment
		G.fields["age"]			= H.age
		G.fields["species"]	= H.dna.species.name
		G.fields["fingerprint"]	= md5(H.dna.uni_identity)
		G.fields["p_stat"]		= "Active"
		G.fields["m_stat"]		= "Stable"
		G.fields["gender"]			= H.gender
		if(H.gender == "male")
			G.fields["gender"]  = "Male"
		else if(H.gender == "female")
			G.fields["gender"]  = "Female"
		else
			G.fields["gender"]  = "Other"
		G.fields["photo_front"]	= photo_front
		G.fields["photo_side"]	= photo_side
		general += G


		Q.Add("INSERT INTO medical (id,name,blood_type,b_dna,mi_dis,mi_dis_d,ma_dis,ma_dis_d,cdi,cdi_d,notes,notes_d) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
			id,
			H.real_name,
			H.dna.blood_type,
			H.dna.unique_enzymes,
			H.get_quirk_string(!medical, CAT_QUIRK_MINOR_DISABILITY),
			H.get_quirk_string(medical, CAT_QUIRK_MINOR_DISABILITY),
			H.get_quirk_string(!medical, CAT_QUIRK_MAJOR_DISABILITY),
			H.get_quirk_string(medical, CAT_QUIRK_MAJOR_DISABILITY),
			"None",
			"No diseases have been diagnosed at the moment.",
			H.get_quirk_string(!medical, CAT_QUIRK_NOTES),
			H.get_quirk_string(medical, CAT_QUIRK_NOTES),
		)
		//Security Record
		var/datum/data/record/S = new()
		S.fields["id"]			= id
		S.fields["name"]		= H.real_name
		S.fields["criminal"]	= "None"
		S.fields["citation"]	= list()
		S.fields["crim"]		= list()
		S.fields["notes"]		= "No notes."
		security += S

		//Locked Record
		var/datum/data/record/L = new()
		L.fields["id"]			= md5("[H.real_name][H.mind.assigned_role]")	//surely this should just be id, like the others?
		L.fields["name"]		= H.real_name
		L.fields["rank"] 		= H.mind.assigned_role
		L.fields["age"]			= H.age
		L.fields["gender"]			= H.gender
		if(H.gender == "male")
			G.fields["gender"]  = "Male"
		else if(H.gender == "female")
			G.fields["gender"]  = "Female"
		else
			G.fields["gender"]  = "Other"
		L.fields["blood_type"]	= H.dna.blood_type
		L.fields["b_dna"]		= H.dna.unique_enzymes
		L.fields["identity"]	= H.dna.uni_identity
		L.fields["species"]		= H.dna.species.type
		L.fields["features"]	= H.dna.features
		L.fields["image"]		= image
		L.fields["mindref"]		= H.mind
		locked += L
	return

/datum/datacore/proc/get_id_photo(mob/living/carbon/human/H, client/C, show_directions = list(SOUTH))
	var/datum/job/J = SSjob.GetJob(H.mind.assigned_role)
	var/datum/preferences/P
	if(!C)
		C = H.client
	if(C)
		P = C.prefs
	return get_flat_human_icon(null, J, P, DUMMY_HUMAN_SLOT_MANIFEST, show_directions)
