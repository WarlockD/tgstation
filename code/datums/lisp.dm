#define _cons(X,Y) list("t_pair",X,Y)
#define _ltrue "t"
#define _lfalse null
#define _car(X) X[2]
#define _cdr(X) X[3]
#define _atom(X) ( !islist(X) ? _ltrue : _lfalse ) // atoms are in lists but they are 1
#define _eq(X,Y) (!islist(X) || !islist(Y) || X != Y ? _lfalse: _ltrue)
#define _cond(X,Y)

/datum/lisp
	var/regex/lisp_parser = new(@"^;.*$|([\(\)\'])(?=[^\s]*)|(\d+)|([^\s\(\)\']+)","gm")
#if 0
	']""[

	]

#endif
	var/text
	var/list/_assoc = list()

/datum/lisp/proc/f_car(list/X) return _car(X)
/datum/lisp/proc/f_cdr(list/X) return _cdr(X)
/datum/lisp/proc/f_atom(X) return _atom(X) ? "t" : null
/datum/lisp/proc/f_cons(list/X) return _cdr(X)
/datum/lisp/proc/f_eq(a, b) return _eq(a,b)

/datum/lisp/proc/_reverse(list/a)
	var/list/p = null
	while(a != null)
		p = _cons(_car(a), p)
	return p

/datum/lisp/proc/_append(list/a, list/b)
	var/list/p = b
	var/list/q = null
	if(a != null)
		a = _reverse(a)
		while(a != null)
			q = _cdr(a)
			_cdr(a) = p
			p = a
			a = q
	return p


	if(_atom(a) && _atom(b))
		return a[1] == b[1] ? "T" : null


/proc/_lisp_token_builder(list/tokens)
	to_chat(world, "DEBUG: token=[tokens.len]")
	if(tokens.len == 0)
		to_chat(world, "DEBUG: Unexpeted EOF of tokens")
		throw EXCEPTION("Bad token")
	var/token = tokens[tokens.len--]
	to_chat(world, "DEBUG: token=[token]")
	if(token == "(")
		to_chat(world, "DEBUG: new (")
		var/list/L = list()
		while(tokens[tokens.len] != ")")
			L[++L.len] = _lisp_token_builder(tokens)
		tokens.len-- // pop the ")"
		to_chat(world, "DEBUG: new )")
		return L
	else if(token == ")")
		to_chat(world, "DEBUG: unexpected )")
		throw EXCEPTION("unexpected )")
	else
		return token
var/count_this = 0

/proc/lisp_printer(v)
	if(v == null)
		return "null"

	if(islist(v))
		var/list/L = v
		if(L.len == 0)
			return "()"
		var/text = "("
		for(var/i=1;i <= L.len; i++)
			if(i > 1)
				text += " "
			text += lisp_printer(L[i])
		text += ")"
		return text
	else
		return "[v]"

/datum/lisp/proc/_getobj(regex/lisp_parser,text)
	if(lisp_parser.match == "(")
		return _getlist(lisp_parser)
	else if(lisp_parser.match == "''")
		if(lisp_parser.Find(text) == 0)
			to_chat(world,"LISP: SyntaxError, bad quote")
			throw EXCEPTION("LISP: SyntaxError, bad quote")
		return _cons("quote", _getobj(lisp_parser,text))
	else if(lisp_parser.group[2])
		return text2num(lisp_parser.match) // number
	else if(lisp_parser.group[1])// ok we got an operator lets save it
		return lisp_parser.match
	else
		to_chat(world,"LISP: SyntaxError[lisp_parser.index], EOF while reading!, missing )?")
		throw EXCEPTION("LISP: SyntaxError[lisp_parser.index], EOF while reading!, missing )?")

/datum/lisp/proc/_getlist(regex/lisp_parser,text)
	if(lisp_parser.Find(text) == 0)
		to_chat(world,"LISP: SyntaxError[lisp_parser.index], missing ending ')'")
		throw EXCEPTION("LISP: SyntaxError[lisp_parser.index], missing ending ')'")
	if(lisp_parser.match == ")")
		return null
	return _cons(_getobj(lisp_parser,text), _getlist(lisp_parser,text))


/datum/lisp/proc/_print_obj(ob, head_of_list)
	if(!islist(ob))
		return (ob == null) ? "null" : "[ob]"
	else
		var/text = head_of_list ? "(" : ""
		var/list/L = ob
		text += _print_obj(_car(L), 1)
		if (_cdr(ob) != null)
			text += " " + _print_obj(_cdr(L), 0)
		else
			text += ")"
		return text


/proc/parse_lisp_script(text)

#if 0
	var/list/tokens = list()
	while(lisp_parser.Find(text) > 0)
		if(lisp_parser.group[2])
			tokens[++tokens.len] = text2num(lisp_parser.match) // number
		else if(lisp_parser.group[3])
			tokens[++tokens.len] = lisp_parser.match // symbol..no strings yet
		else if(lisp_parser.group[1])// ok we got an operator lets save it
			tokens[++tokens.len] = lisp_parser.match
		else
			to_chat(world, "DEBUG: bad tag '[lisp_parser.match]''")

	to_chat(world,"Ok we parsed and have [tokens.len] tokens")
	reverseRange(tokens) // reverse it to turn it into a token stack

	var/list/sexpr = _parse_lisp_script(tokens)
	to_chat(world,"Ok we parsed and have [sexpr.len] sexpr")
	var/test_text = lisp_printer(sexpr)
	to_chat(world,"Ok we parsed and have [test_text] sexpr")
#endif
	var/datum/lisp/L = new

	var/sexpr = null
	if(lisp_parser.Find(text) > 0)
		sexpr = L._getobj(lisp_parser,text)
	to_chat(world,"Ok we parsed and have [L._print_obj(sexpr)] tokens")


/mob/verb/lisptest()
	to_chat(world,"start sexpr")
	var/teste_text = {"
		(defun pair. (x y)
  (cond ((and. (null. x) (null. y)) '())
        ((and. (not. (atom x)) (not. (atom y)))
         (cons (list. (car x) (car y))
               (pair. (cdr x) (cdr y))))))
	"}
	parse_lisp_script(teste_text)

