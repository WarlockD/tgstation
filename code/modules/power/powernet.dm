////////////////////////////////////////////
// POWERNET DATUM
// each contiguous network of cables & nodes
/////////////////////////////////////

#define GRID_VISITED_BLACK 0
#define GRID_VISITED_GREY 1
#define GRID_VISITED_WHITE 2

/datum/graph
	var/list/vertices  = list()
	/// Node Types, these types are included in searching for connection

/datum/graph/Destroy()
	vertices = null
	return ..()

/// Running this dosn't mean all the graph components are connected
/// It just merges all the nodes and vertices but it dosn't verify
/// they are all connected
/datum/graph/proc/merge(datum/graph/G)
	vertices.Add(G.vertices)
	for(var/datum/component/graph/T in G.vertices)
		T.graph = src
	qdel(G)



/datum/graph/proc/reconnect(datum/component/graph/START, datum/graph/G)
	var/list/Q = list()
	var/list/L
	Q[++Q.len] = START
	while(Q.len)
		var/datum/component/graph/C = Q[Q.len--]
		if(G.vertices[C])
			continue
		C.visited = GRID_VISITED_BLACK
		L = vertices[C]
		vertices[C] = null
		vertices.Remove(C)
		G.vertices[C] = L
		C.graph = G
		for(var/i in 1 to L.len)
			var/datum/O = L[i]
			if(!G.vertices[O])
				Q[++Q.len] = O

/datum/graph/proc/rebuild_graphs()
	var/datum/component/graph/START = null
	while(vertices.len)
		for(var/datum/component/graph/A in vertices)
			START = A
			break
		ASSERT(START != null)
		var/type/G = new
		reconnect(START,G)


/*
** While this is called disconnect, this verfiys the graph
** and rebuilds all the connected nodes so they are valid
** have to give it a starting node however
*/
/datum/graph/proc/disconnect(datum/component/graph/A)
	var/list/neighbors = vertices[A]
	for(var/i in 1 to neighbors.len)
		var/datum/component/graph/B = neighbors[i]
		if(vertices[B])
			vertices[B]:Remove(A)
	vertices[A] = null
	A.graph = null
	vertices.Remove(A)
	rebuild_graphs()


/datum/graph/proc/connect_vertex(datum/component/graph/A, datum/component/graph/B)
	if(!vertices[A])
		vertices[A] = list(B)
	else
		vertices[A]:Add(B)

	if(!vertices[B])
		vertices[B] = list(A)
	else
		vertices[B]:Add(A)

	if(A.graph.vertices.len > B.graph.vertices.len)
		B.graph = A.graph.merge(B)
	else
		A.graph = B.graph.merge(A)

/datum/graph/proc/disconnect_vertex(datum/component/graph/A, datum/component/graph/B)
	ASSERT(A.graph == B.graph)
	if(vertices[A])
		vertices[A]:Remove(B)
	if(vertices[B])
		vertices[B]:Remove(A)


/datum/graph/proc/get_neighbors(datum/component/graph/A)
	if(!vertices[A])
		vertices[A] = list()
	return vertices[A]
#define ON_TURF (-1)

/datum/component/graph
	var/datum/graph/graph
	var/visited = GRID_VISITED_BLACK
	var/vertex_type = null
	var/vertex_dir_mask = NORTH | SOUTH | EAST | WEST
	var/vertex_dir = 0

/datum/component/graph/New()
	if(!graph)
		graph = new
	connect_neighbors()

// overwrite to stop finding more conenction points
/datum/component/graph/proc/connect_edges()
	return

/datum/component/graph/proc/connect_neighbors()
	connect_edges()	// connects edges first in case it overrides the mask
	for(var/dir in GLOB.cardinals_multiz)
		if(dir & vertex_dir_mask)
			var/turf/T = get_dir(parent, dir)
			if(visited != GRID_VISITED_GREY &&!(dir & vertex_dir))
				for(var/vertex_type/C in T)
					var/datum/component/graph/G = C.GetComponent(datum/component/graph)
					if(G && G.visited != GRID_VISITED_WHITE)
						vertex_dir |= dir
						G.vertex_dir |= turn(dir,180)
						G.visited = GRID_VISITED_GREY
						graph.connect_vertex(src, G)
	visited = GRID_VISITED_WHITE
	SEND_SIGNAL(parent, COMSIG_ATOM_UPDATE_ICON)

// overwrite to stop finding more conenction points
/datum/component/graph/proc/disconnect_edges()
	return

/datum/component/graph/proc/disconnect_neighbors()
	disconnect_neighbors()
	for(var/dir in GLOB.cardinals_multiz)
		if(dir & vertex_dir)
			var/turf/T = get_dir(parent, dir)
			for(var/vertex_type/C in T)
				var/datum/component/graph/G = C.GetComponent(datum/component/graph)
				if(G)
					G.vertex_dir &= ~turn(dir,180)
					SEND_SIGNAL(G.parent, COMSIG_ATOM_UPDATE_ICON)


/datum/component/graph/Destroy()
	disconnect_neighbors()
	if(graph)
		graph.disconnect(src)
		graph = null
	return ..()

/datum/graph/powernet
	var/number					// unique id
	var/list/consumers = list()
	var/list/producers = list()

	var/load = 0				// the current load on the powernet, increased by each machine at processing
	var/newavail = 0			// what available power was gathered last tick, then becomes...
	var/avail = 0				//...the current available power in the powernet
	var/viewavail = 0			// the available power as it appears on the power console (gradually updated)
	var/viewload = 0			// the load as it appears on the power console (gradually updated)
	var/netexcess = 0			// excess power on the powernet (typically avail-load)///////
	var/delayedload = 0			// load applied to powernet between power ticks.


/datum/graph/powernet/New()
	var/static/ID = 0
	number = ++ID
	SSmachines.powernets[src] = number


/datum/graph/powernet/Destroy()
	//Go away references, you suck!
	for(var/obj/machinery/power/M in consumers)
		M.powernet = null
	for(var/obj/machinery/power/M in producers)
		M.powernet = null

	consumers = null
	producers = null

	SSmachines.powernets[src] = null
	SSmachines.powernets.Remove(src)
	return ..()


// overwrite to stop finding more conenction points
/datum/component/graph/powernet


/datum/component/graph/powernet/New()
	graph = new/datum/graph/powernet
	. = ..()

//remove a power machine from the current powernet
//if the powernet is then empty, delete it
//Warning : this proc DON'T check if the machine exists
/datum/component/graph/powernet/remove_machine(obj/machinery/power/M)
	if(M.power_use_type & POWER_CONSUMER)
		graph:consumers.Remove(M)
	if(M.power_use_type & POWER_PRODUCER)
		graph:producers.Remove(M)
	M.powernet = null
	SEND_SIGNAL(parent, COMSIG_ATOM_UPDATE_ICON)


//add a power machine to the current powernet
//Warning : this proc DON'T check if the machine exists
/datum/component/graph/powernet/add_machine(obj/machinery/power/M)
	if(M.powernet)// if M already has a powernet...
		if(M.powernet == graph)
			return
		else
			// ok it shouldn't be on ANY powernet so we want it super gone
			M.powernet.remove_machine(M)
	M.powernet = graph
	if(M.power_use_type & POWER_CONSUMER)
		graph:consumers[M] = src
	if(M.power_use_type & POWER_PRODUCER)
		graph:producers[M] = src

//handles the power changes in the powernet
//called every ticks by the powernet controller
/datum/component/graph/powernet/proc/reset()
	//see if there's a surplus of power remaining in the powernet and stores unused power in the SMES
	netexcess = avail - load

	if(netexcess > 100 && nodes && nodes.len)		// if there was excess power last cycle
		for(var/obj/machinery/power/smes/S in nodes)	// find the SMESes in the network
			S.restore()				// and restore some of the power that was used

	// update power consoles
	viewavail = round(0.8 * viewavail + 0.2 * avail)
	viewload = round(0.8 * viewload + 0.2 * load)

	// reset the powernet
	load = delayedload
	delayedload = 0
	avail = newavail
	newavail = 0

/datum/component/graph/powernet/proc/get_electrocute_damage()
	if(avail >= 1000)
		return clamp(20 + round(avail/25000), 20, 195) + rand(-5,5)
	else
		return 0
