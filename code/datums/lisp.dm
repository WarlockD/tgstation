
#define lisp_debug(m,e) to_chat(world,"[__FILE__]:[__LINE__]: " + (m) + ": " + print_obj(e,1))

#define cons(X,Y) (list((X), (Y)))
#define is_pair(X) (islist(X))
#define is_atom(X) (!is_pair(X))

var/ltrue = cons("quote", cons("t", null))
var/lfalse = null

#define car(X) ((X)[1])
#define cdr(X) ((X)[2])
#define eq(X,Y) (is_atom(X) && is_atom(Y) && (X) == (Y))
#define _getchar(...) ((length(buffer) > idx) ? null : buffer[idx++])


#define  is_syntaxquote(x)  ((x) == "'" || (x) == "`" || (x) == ",")
#define  is_doublequote(x)  ((x) == "\"")

#define  is_op(x) ((x) == "-" || (x) == "+" || (x) == "*" || (x) == "/"	\
   || (x) == "=" || (x) == "%" || (x) == "^" || (x) == "&" || (x) == "|" || (x) == "!")

#define is_space(x)  ((x) == " " || (x) == "\n")
#define is_parens(x) ((x) == "(" || (x) == ")")

/datum/lisp
	var/list/symbols = null
	var/look
	var/token
	var/buffer
	var/idx = 0

/datum/lisp/New(S)
	buffer = S
	idx = 1
	look = ""
	token = ""

/datum/lisp/proc/gettoken()
	while(is_space(look))
		look= _getchar()

	if(is_parens(look))
		token = look
		look = _getchar()
	else
		var/list/string_builder = list()
		while(look != null && !is_space(look) && !is_parens(look))
			string_builder += look
			look = _getchar()
		token = string_builder.Join()

/datum/lisp/proc/getobj()
	if (token == "(")
		return getlist()
	return token

/datum/lisp/proc/getlist()
	gettoken()
	if (token == ")")
		return null
	return cons(getobj(), getlist())


/datum/lisp/proc/print_obj_(list/ob, head_of_list=FALSE, list/string_builder)
	if(is_atom(ob))
		string_builder += isnull(ob) ? "null" : ob
	else
		if(head_of_list)
			string_builder += "("

		print_obj_(car(ob), TRUE)

		if (cdr(ob) != null)
			string_builder += " "
			print_obj_(cdr(ob), FALSE)
		else
			string_builder += ")"

/datum/lisp/proc/print_obj(ob, head_of_list=FALSE)
	var/list/string_builder = list()
	print_obj_(ob,head_of_list,string_builder)
	return string_builder.Join()

/datum/lisp/proc/f_car(X)
	return car(car(X))
/datum/lisp/proc/f_cdr(X)
	return cdr(car(X))
/datum/lisp/proc/f_eq(X)
	return car(X) == car(cdr(X)) ? ltrue : lfalse
/datum/lisp/proc/f_pair(X)
	return is_pair(car(X))     ? ltrue : lfalse
/datum/lisp/proc/f_atom(X)
	return is_atom(car(X))     ? ltrue : lfalse
/datum/lisp/proc/f_null(X)
	return car(X) == null      ? ltrue : lfalse
/datum/lisp/proc/f_readobj(X)
	look = _getchar()
	gettoken()
	return getobj()
/datum/lisp/proc/f_writeobj(X)
	print_obj(car(X), 1)
	return getobj();


// http://cslibrary.stanford.edu/105/LinkedListProblems.pdf

/datum/lisp/proc/evlist(list/V, list/ENV)
	var/list/head = null
	var/list/last = null
	for(var/L=V; !isnull(L); L = cdr(L))
		if(isnull(head))
			head = last = cons(lisp_eval(car(L), ENV) , null)
		else
			cdr(L) = cons(lisp_eval(car(L), ENV) , null)
			last = cdr(L)
	return head

/datum/lisp/proc/pair_to_list(list/V)
	var/list/A = list()
	for(var/list/L=V; !isnull(L); L = cdr(L))
		A += car(L)
	return A

/datum/lisp/proc/apply_primitive(primfn, list/A)
	return call(primfn)(pair_to_list(A))

/datum/lisp/proc/lisp_eval(exp, env)
	if(is_atom(exp))
		for(var/E = env; !isnull(E); E = cdr(E))
			if (exp == car(car(E)))
				return car(cdr(car(E)))
		return
	else if(is_atom(car(exp)))
		switch(car(exp))
			if("quote")
				return car(cdr(exp))
			if("if")
				if (lisp_eval(car(cdr(exp)), env) != null)
					return lisp_eval(car(cdr(cdr(exp))), env)
				else
					return lisp_eval(car(cdr(cdr(cdr(exp)))), env)
			if("lambda")
				return exp /* todo: create a closure and capture free vars */
			if("apply")
				var/A = evlist(cdr(cdr(exp)), env);
				A = car(A) /* assumes one argument and that it is a list */
				return apply_primitive( lisp_eval(car(cdr(exp)), env), A)
			else
				var/primop = lisp_eval (car(exp), env)
				if (is_pair(primop))  /* user defined lambda, arg list eval happens in binding  below */
					return lisp_eval( cons(primop, cdr(exp)), env )
				else if (primop) /* built-in primitive */
					return apply_primitive(primop, evlist(cdr(exp), env))

	else if(car(car(exp)) == "lambda")  /* should be a lambda, bind names into env and eval body */
		var/extenv = env
		var/vars = cdr(exp)
		var/list/names = car(cdr(car(exp)))
		for(!isnull(names))
			extenv = cons (cons(car(names),  cons(lisp_eval (car(vars), env), null)), extenv)
			names = cdr(names)
			vars = cdr(vars)
		return lisp_eval (car(cdr(cdr(car(exp)))), extenv);

	to_chat(world,"cannot evaluate expression")
	return null



#undef lisp_debug

#undef cons
#undef is_pair
#undef is_atom

#undef car
#undef cdr
#undef eq
#undef _getchar
