////////////////////////////////////////////
// POWERNET DATUM
// each contiguous network of cables & nodes
/////////////////////////////////////

/datum/graph
	var/list/vertices  = list()
	var/list/edges = list()
	/// Node Types, these types are included in searching for connection
	var/len = 0

/datum/graph/New()

/datum/graph/Destroy()
	vertex = null
	edges = null
	return ..()

/// Running this dosn't mean all the graph components are connected
/// It just merges all the nodes and vertices
/datum/graph/proc/merge(datum/graph/G)
	vertices.Add(G.vertex)
	edges.Add(G.edges)
	len = vertices.len + edges.len
	for(var/datum/component/vertex/T in G.vertices)
		T.graph = src
	for(var/datum/component/edge/T in G.edges)
		T.graph = src
	qdel(G)
	return src

/datum/graph/proc/connect_vertex(datum/component/vertex/A, datum/component/vertex/B)
	if(!vertices[A])
		vertices[A] = list(B)
	else
		vertices[A]:Add(B)

	if(!vertices[B])
		vertices[B] = list(A)
	else
		vertices[B]:Add(A)

	if(A.graph.len > B.graph.len)
		B.graph = A.graph.merge(B)
	else
		A.graph = B.graph.merge(A)
	len = vertices.len + edges.len

/datum/graph/proc/disconnect_vertex(datum/component/vertex/A, datum/component/vertex/B)
	ASSERT(A.net == B.net)
	if(vertices[A])
		vertices[A]:Remove(B)
	if(vertices[B])
		vertices[B]:Remove(A)
	len = vertices.len + edges.len

/datum/graph/proc/connect_edge(datum/component/vertex/A, datum/component/edge/B)
	if(!vertices[A])
		vertices[A] = list(B)
	else
		vertices[A].Add(B)
	edges[B] = A

/datum/graph/proc/disconnect_edge(datum/component/vertex/A, datum/component/edge/B)
	if(vertices[A])
		vertices[A]:Remove(B)
	edges[B] = null
	edges.Remove(B)

/datum/graph/proc/get_neighbors(datum/component/vertex/A)
	if(!vertices[A])
		vertices[A] = list()
	return vertices[A]

/datum/component/vertex
	var/list/edges = list()
	var/list/vertex_type = null
	var/list/edge_type = null
	var/graph = null

/datum/component/graph/Destroy()
	//Go away references, you suck!
	for(var/obj/structure/cable/C in cables)
		cables -= C
		C.powernet = null
	for(var/obj/machinery/power/M in nodes)
		nodes -= M
		M.powernet = null


/datum/powernet
	var/number					// unique id
	var/list/cables = list()	// all cables & junctions
	var/list/nodes = list()		// all connected machines

	var/load = 0				// the current load on the powernet, increased by each machine at processing
	var/newavail = 0			// what available power was gathered last tick, then becomes...
	var/avail = 0				//...the current available power in the powernet
	var/viewavail = 0			// the available power as it appears on the power console (gradually updated)
	var/viewload = 0			// the load as it appears on the power console (gradually updated)
	var/netexcess = 0			// excess power on the powernet (typically avail-load)///////
	var/delayedload = 0			// load applied to powernet between power ticks.

/datum/powernet/New()
	SSmachines.powernets += src

/datum/powernet/Destroy()
	//Go away references, you suck!
	for(var/obj/structure/cable/C in cables)
		cables -= C
		C.powernet = null
	for(var/obj/machinery/power/M in nodes)
		nodes -= M
		M.powernet = null

	SSmachines.powernets -= src
	return ..()

/datum/powernet/proc/is_empty()
	return !cables.len && !nodes.len

//remove a cable from the current powernet
//if the powernet is then empty, delete it
//Warning : this proc DON'T check if the cable exists
/datum/powernet/proc/remove_cable(obj/structure/cable/C)
	cables -= C
	C.powernet = null
	if(is_empty())//the powernet is now empty...
		qdel(src)///... delete it

//add a cable to the current powernet
//Warning : this proc DON'T check if the cable exists
/datum/powernet/proc/add_cable(obj/structure/cable/C)
	if(C.powernet)// if C already has a powernet...
		if(C.powernet == src)
			return
		else
			C.powernet.remove_cable(C) //..remove it
	C.powernet = src
	cables +=C

//remove a power machine from the current powernet
//if the powernet is then empty, delete it
//Warning : this proc DON'T check if the machine exists
/datum/powernet/proc/remove_machine(obj/machinery/power/M)
	nodes -=M
	M.powernet = null
	if(is_empty())//the powernet is now empty...
		qdel(src)///... delete it


//add a power machine to the current powernet
//Warning : this proc DON'T check if the machine exists
/datum/powernet/proc/add_machine(obj/machinery/power/M)
	if(M.powernet)// if M already has a powernet...
		if(M.powernet == src)
			return
		else
			M.disconnect_from_network()//..remove it
	M.powernet = src
	nodes[M] = M

//handles the power changes in the powernet
//called every ticks by the powernet controller
/datum/powernet/proc/reset()
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

/datum/powernet/proc/get_electrocute_damage()
	if(avail >= 1000)
		return clamp(20 + round(avail/25000), 20, 195) + rand(-5,5)
	else
		return 0
