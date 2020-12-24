

/obj/machinery/computer/med_data//TODO:SANITY
	name = "medical records console"
	desc = "This can be used to check medical records."
	icon_screen = "medcomp"
	icon_keyboard = "med_key"
	req_one_access = list(ACCESS_MEDICAL, ACCESS_FORENSICS_LOCKERS)
	circuit = /obj/item/circuitboard/computer/med_data
	light_color = LIGHT_COLOR_BLUE
	var/rank = null
	var/screen = null
	var/datum/data/record/active1
	var/datum/data/record/active2
	var/temp = null
	var/printing = null
	//Sorting Variables
	var/sortBy = "name"
	var/order = 1 // -1 = Descending - 1 = Ascending
	var/list/fields = list()
	var/force_update_fields = FALSE // this needs to be a signal from record
	var/test_data = @{"+{ @|GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGLQV}[~!@E,aJbOdTfYh^k"CmHpMsRvWy\}#A-aFdKiPmUqZv_z$DI.dNiSnXs]y%B~G/dLjQpVu[{&@0bEhJnOtTzY1a^g'CmHtMzR2`Wg\m(AsFzK3`PfUlZr_x)D~I4dNjSpXu]{*B5`GfLkQpVu[z+@~E6cJgOkToYs^w,C{H~M7aRdWg\i-AlFnKpPrUsZu_v.DwIxNSXy]x/BGLwQvVu[s0@rEpJnOlTiYg^d1CaH6~M{RwWs\p2AlFgKcP5UzZu_p3DkIfNaS4{Xv]p4BjGdL3QyVs[l5@fE`J2zOtTmYg^a6C1zHtMmRgWa\0z7AtFnKhPbU/|Zv_p8DjIdN.SyXt]n9BiGdL-QzVv[q:@mEiJeOaT,}Yz^v;CsHpMmRkWh\f<AdFbKaP+U~Z}_|=DINSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS{SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSNIDz<_yZxUvPuKsFqAo;\mWjRgMdHaC*~:^zYwTsOoJkEg@b9[)~VyQtLoGjBe8](XzStNoIiDc7_'}ZwUqPkKeF&Ay6\sWlRfM`H%zCs5^mYgTaO${JtEn@h4[bV#|QwLqGkBf3]`X"{SvNqIlDg2_bZ!~UyPuKqFmAi1\eWbR M|HyCv0^sYqToOmJkEj@h/[gVfQeLGBd.]eXSNfIgDh-_jZkUmPoKqFsAv,\yW|RM!bHeCi+^mYqTuOyJ~E"b@g*[lVqQvL{G#aBf)]kXqSwN}I$cDi(_oZuU{P%aKgFmAt'\zW&`RfMmHsCy&^Y'eTlOrJxE~@(c%[iVoQuLzG)`Be$]jXoStNyI~D*b#_gZkUoPsKwF{A~"\+aWdRgMjHmCo!^qYsTuOvJxEy@z [{VQL|Gs!Xr]p"BnGd[a#@*E{JxOuTrYn^j$CgHcM)R{Wv\r%AnFiKeP`U({Zw_r&DmIhNcS'~Xy]t'BoGjLeQ`V&{[v(@qElJgObT%}Yx^s)CnHiMeR`W$|\w*AsFoKjPfUbZ#_{+DwItNpSmXj]g,BdGaL"Q}Vz[x-@vEtJsOqTpYo^n.CmHlMRW\l/AFKmPUnZo_p0DrIsNuSwX}]#b1BhGLiQVpYw[~^{2AyE~K$dRjSoUrRuOxLzI}G%bGgGlFqJvM{QzUyY]rXlTeOTYn3BxF&`LdRiXcY%}TwOqJlEfBa2_$3C%cHhN$LyGsCm2_o3DqJvPzV%aYh\n4@o3\pYtXwX{]~4B&bG`MfQmVqUuUzW~Y'b^f5CjHnMrSoSlTiTcP&~KyHtFoDjBe@iEnJrOwQ|T'aVfYj[o^s6CxH|M(aR'|PxO|TZ(bZeZgZjZlZoZr^u7CxH|M}K~J)`I(~E|A{6]yYxUwQzR~SW)a[c7@gCkGmEoDsHwM{Q~V*bZe_f8ChGiKeGbC)~7_zZwZuZy_}8D*aIeORfUcQ)M{IxEtBuFwJqDl7^o8CsHvMzS}UW*bYe[g]k9AnEqItNwRzV{Y\|^y[vWsQoLkGgBfDjImNpStWw[z:@}E+`JbOcQS`M*}GL+aQdVf[h;@AiCf:^dYaT*O|JyEv@s9[qXnUqYs^v:CzH}N+`ScXf^h;CkImNoTqZs<@tBDuGvILtFr@p;YnTlOjJhEf@c:[`U*|OxIyKMzO{QvJrDBA@r9_nYkTgOcJdIeIfIcC)8]{XvSqNsRuVx[w[v\rVnQjKfFbD(B)bFeKlRrYu]x9A{EzEyEwEs@n8ZiTeNcKaH(E}Ay7\uWqRlLiKeJaI'yC@y6^z\ZtSnMhGeGaG&yAv5\sWoSlNiJ`D%|4^yYuSrNlLfJjOnTsYx^|5CH&aMeRiWn\s6AvFyKsFmAg5\bV%}PxJsDn4_iYdT$OzIvDq3_s\uYpRkLaF#}FxGrCk2_lYqXvXzXX{RxLsJmHhFbE"1_}Z{UyOwJvEt@w0Yo-\p.AqGuKxO|T#aRgPlNnHpBr-\WsQtLuFwAx,[s[m[i_d-D"I{NvSrXo\'n'HiMdScVZgXlWsQzL~G(cBg&]lXpSuNwJyF|BxDtFoJjOdT'Yy^t'CnH(a&_fYkTfW'|_w'FzF(b&^)x%FtKpPlUgZc_(&D{IvNrSnXi]e'B`G'|LwQsVo[j(@fEaJ&}PyUtZp_l)DgIcN%S{Xw]s*BpGlLhQeVa[$~+@{EwJtOrToZl_i,DgIeNbS`X#~]}-B{GzLxQwVv[u.@tEJsOTY_j-XkPfM`U"~^#c.Bf-]jX)f&XiRlMoHrCs@s%]tZWuTvRrUmYi]e&B`G(|LxQtVo[k'@gEbJ'~OyTuYq_l(DhIdN&S{Xw]s)BoGkLgQcV%\{*AwFtKpPmUiZf_c+D`I$}NzSwY}W%cViUnSk\o,@w+\zV}P&dOjOpPXn]k,CiHdG`Fb+_%Yz[t^n,@iCcF`C$|AtDqInNlSjXh]f-BdHbMaR#W~\}.A|G{LQzV[z/@wEtJrOpTnYl^l0CHmMSrYv_{1E$aHgKlKrLxL}M%cMfKiHAc0]$|[uYr^w1A|A%aA$~EwHqFkEeD`0^cWfTjQmNqKtHxE|B%`/_c\gYiTjOkJmDl._kZUiQhLgGfBe-^dYcTO$~IC~,^%cZgZf_f-DIhMjQnPsMtGvBzB&`FfFJOgTYh^i.CjHkMlRmWn\o/AqFrKtPvUyZ}_'a0DfGjKoOsRxV}Z(a^c1CeHgMiRkWm\p2ArGsBu1^wYvSMuGvBw0\yV{Q~K)aHdDh@k/\nXrTuPyL}I*bFhCnAsCxE}G~NU|[z0AxGuKsOpTmXk]h1AfFbJ)~NzRvVzTS*cRhPlOqNuMrQpVkZg^c2CeGjEnCsArGqLQpVo[n3AqFuEv@w2[xWzR{M}I~D+`@*EJOU~Z_~3DJO+cNhGAi2\WQjLGkBo1\s2ErJOTqZ_q3DpIsOwJxEy@z2[{V|QK{F@z1[UR,dThVlYp[u^}_-`W,~S{OvMqKlIgGbEc0_dZfUgPhKiFkAl/\mWnRoMuM{M-aMgMmMrMpRhTdVmWtVzUS.dQiOnMsLoPjTfY`Z-z[u^v0B~C.dAj@p/^v]|Y/bVeRiNmJpGtCw._z[yUxO}M0bKfIkGpFuDyB~@1c-^g]l[pYuWyU~T2dTjUpUo[o.@nFmKlQkVi\i/EqItDw@y.[|W~S3aNcJeEgAi-]jXlTnOoKpGqBr,^sYtUQrJnEiAb+]2zYuWpUkSfQaP1|NwLrJmIhGcE0CzAu@p*^l\gZbY/~WyUuSpQkQeQcN.O{PwKHzDvCsCr)]XmZjXhRYi*@e)_a^-}YyTuOrJnFkDgBd@a(^,}\z[v[sZpZjXhPfKeFcAb'\aW`R+J}F}&_XV,aUcTeSfRhQjPlOnNoMqLsKtJvIwHyGzF|E}D~C-`Ba@bGaLdRfPdGDeAe%^i&DmJpRrSqLmFjAi%[hViUjUlVjPiKfIgOfOePaL,}C|$^{ZyX\{_{%D|IyHKxLwHtEuKvOwPyR{TzUyVxWwXuYtZs[q]p^o_m&@lAjBiCgEeFdGbH`I+~J}K|G{Cz%^yZVwRuTY^t&CINSNsIDs%_YqXpZo_o&DnIoMRpV[oWnSOHoBo%\mZk]j&EkJlPkKjGgJePfTgXh\gWfRdUaX*Y|[z\y'D|C~B+aAdAEJOeSXf]c(@`C*~G{JxNuQrTnVjYf[b]b)Af@j(_n_r^v]x)@{B~E+`JO*|OxOuOqOmOjOfObP)P{PwPsPpPlPhRdT`U(|WxYtZo\k^g_c*A'~CzDuFqHlIhKcM&~NzPuRpSxLzGtGmKfT%Yx_zZS&eMjHoCt)^yY~T'bOgJlEp(_uYyS}M(aHdBg'\jWmRoMqHsDw&^zY~S)aNjEnBoCmGgNeScYfX&r+JtEu@w*[sZoZi_d+E%~J&cJhImHrGh,ScR%~RyRtRuVw[|\&a]g_hYjS'j0LmRoYuUq\v1Dz@~0\{1@wEzM(`KeIcMaQdVjTfWh_n^'j0DoCtCyC~C(d@i/]jVlPnImCm.]WhObPcUdZe/@bE'J|OvRpUgTdOaJ&~E.]'bVfPbO&}RyVv[t/@uDwIzN|S~X'`]i0C(v1EqAm0^hZdWjYo[nTmNlHpKtOuIvDw/_xZ|U)`PiNcTaY(^0D)`Ka-\d.AhFdJ(N{R)bQiPkUm[p]WqRvP{N*aM){IvFw@x-ZvZs^o.Bj@e-^`\*p.VuV{V+aW]a/Dd._h[lWrWyXtUpRtLyGrHlIfKcD`-^*|.E~J+aP*}RtSpV+v/[u0@FL{N,aQ+|SwUz^u[qYlYgZc[*~\+bXfTbO*}J+cIhHlCq/_v[,rMmKhIcHeEjEoEtDyCu@p.^k[fYaV+|TR,bRgSmSrTmQhNcK+}IyA}A,bBiBe-_a\+|ZwXvU{ROyNsMmLhMbN*}OwP|M+`JdGiDmAq,^u[zYtYoYjYeY`Y*|\w_s-BoEjHfKjEn,_r[vWzS~P+bLfHjDnAiAdA*~BzCuEpFkHfJjFnBr+_v[zW~S+cQgOkMoKkJgJcJfFiCm*_p\sYoZj[e\a]*|^Z+cWfSiPlLoIsFwD|B@,c)^g[cZ+~Zz[v]q^m*@p)\sYuUxR{N~K,aIeHhGlFoDkDgEcEAf(^i[kY-i)DeEdJeOfTgY^h*DiIjNkSlX^n+CoHpMrRVq[q,@EpJOoTYn^n-CmHlLqVyY~W.cVeZdScMo.Zk\g_b/A-~DyGpEm.\oVpQqLrGnDjAcAc-ZfTdQ`TbNcIfDh,_f\,~\{\~W-aRcMfHaF,|D+^-bYdS,SzSuSxO{K~G}CxBsBr*_vY|X}TyRuQyN}K-aH,}GyFuEw)\{[-`[,~U{OyI|ED-bCfByVuSrV^s*CuHwNSxYy^y+DzIO{T|Z~,@}H.aKfOmMoGqAs+\vYzV}S/`NdRiPnNkRiWk\s[p_m,DuInLoSuYnZo_x-DrDmDqJtQkQjWi^hYfTdOJE@d,[.{WxQuKrFuA}@/`F.|IuEAc*AeFgKiPkUmZu^y]}\/a[.|X{PnGjDImKnG/w+K~O0dTbY/_0c[gXm\s,Ap+[lUpRtPxMsMnMjMgHeBb*]c+BGdL/~KwK0mHpEsByDF1dHjJpLrQsVu[t,@rFnIjMfLeIhBg+\eWdQ0N{JsHmH2m,EqKvQrToWtVyU3`\VgUaN2EzJuGoE-F|IyLvOrRoViRdOcICb,^aX`Rp.GuJyMsNnO/zJvDr-^m.@EJOjJfEcIaM.~RwW\oZSlMgKbOT,c(W`T+}QzO{JE|@|'[z(@xEvJsGqEnCoIqOnRkUhXlXpXtXu]w)BxGyAy([zU}U,aVdV*x*PtLoIrDt)_p*CkGgFcE)E*aIdM`O){RwUzZ*`WfUhYk]lTrRwPf,VaR)}O~H*`A){EwJsHnFjElKnQiTeWjXpZs^v-Cy,^|Y*aWfV(v+]zV~PK)`FA(*[~UzQvNrMnMkLeP'TzYu^r+CoHlMiShXg]k_o,Bp+YrTuOxJ{E(`Af*^j^n_o+CpHqMrRWq]v]g-LaJ'{HuF@t,[p_l-CgAb@&},^'a-CeHaK&|OxS}Q'bPgNjSnWq\rWRsMxL}L(bLgL+f']iZlWnTqQtNvLyJ{H}F,b1B+|DwFpDkEfGaI*|KwMrN)x%EzEvJrOoTkYg^b&C(~HzMvRrWm\i'AeFaK'|PxUtZo_k(DgIbN&~SzXv]r)BnGjLfQbV%~[z*@vEsJoOlThYe^b+C$H|MyRvWt\q,AoFlKjPhUfZd_c-DaI`N#~S}X|]|.B{GzLQVw_s]&v/UZw_w0DxIyNzS{X|]}1BH'`MaRcWe\f2AhFjKlPnV(rGsLuQvVx[y3@{F|K~P)`UbZc4@eEgJiOkTmZo_q5DsIuNwT,}1_|2DI{NTYz^z3DyIxNS/z.\z/AFKPyUZx_x0EwJvOTuYt^s1CrHqNoSnXm]k2BjGiLgQeWd\b3A`F.K}P{UyZ3u,RwWy\{-A}F~KP4aUbZc_d.DIeNSX]e/BH-i%KkPnUqZs_v&DyI{N~S.aYd^g'CjHlMoRrWu\x(B{G}L/`QcVf[h)@kEnJ2q/INpSXo]n0BmGlLkQjVi[g1@fEdJbO`T1~Y|^z2CxHuMsRpWn\k3AhFeKbP)f&Xc]('B{GxLtRqWm\i(AfFbL'Q{Vx[t)@qFnKjPgUd[{3T~Y(`^c4CeI+{ @*`Z"}

/obj/machinery/computer/med_data/Initialize(mapload)
	. = ..()
	fields["id"]			= 3432-12
	fields["name"]		= "Hank Chowder"
	fields["rank"]		= "Lawman"
	fields["age"]			= 35
	fields["species"]	= "MOTHMAN"
	fields["fingerprint"]	= md5("JUSTAHACKMAN")
	fields["p_stat"]		= "Active"
	fields["m_stat"]		= "Stable"
	fields["gender"]			= "Male"


/obj/machinery/computer/med_data/syndie
	icon_keyboard = "syndie_key"



/obj/machinery/computer/med_data/ui_interact(mob/user, datum/tgui/ui)
	force_update_fields = TRUE // force a data update
	ui = SStgui.try_update_ui(user, src, ui)
	if(!ui)
		ui = new(user, src, "TN3270", name)
		ui.open()


#define CELL_NORMAL       (0)
#define  CELL_BLINK       (1 << 0)
#define  CELL_HIDDEN      (1 << 1)
#define  CELL_HIGHLIGHT   (1 << 2)
#define  CELL_UNDERLINE   (1 << 3)
#define  CELL_REVERSE     (1 << 4)
#define  CELL_NEUTRAL     (0 << 5)
#define  CELL_BLUE        (1 << 5)
#define  CELL_RED         (2 << 5)
#define  CELL_PINK        (3 << 5)
#define  CELL_GREEN       (4 << 5)
#define  CELL_TURQUOISE   (5 << 5)
#define  CELL_YELLOW      (6 << 5)
#define  CELL_WHITE       (7 << 5)
#define  CELL_COLOR_MASK  (7 << 5)
#define  CELL_UPDATE_ON_ENTER  (1<<9)
#define  CELL_UPDATE_ON_LOST_FOCUS  (1<<10) // like on tab, we send an act
#define  CELL_UPDATE_ALWAYS (1<<11) // this cell is always sent on any act update
#define  CELL_READONLY 		(1<<12) // this cell is always sent on any act update

/obj/machinery/computer/med_data/ui_static_data(mob/user)
	var/list/data = list()
	data["screen"] = "medical"
	data["menu_mode"] = "login"
	data["test_data"] = test_data
	if(force_update_fields)
		var/list/F = list();
		for(var/name in fields)
			F[name] = fields[name]
		data["fields"] = F
		force_update_fields = FALSE
	var/static/time_count = 1;
	data["update_time"] = time_count++;
	return data

/obj/machinery/computer/med_data/ui_data(mob/user)
	var/data = list()

	return data


/obj/machinery/computer/med_data/ui_act(action, params)
	. = ..()
	if(.)
		return
	switch(action)
		if("update")
			var/field = params["field_name"]
			var/value = params["field_value"]
			fields[field] = value;
			return TRUE;
		if("update_all")
			var/list/changed_fields = params["fields"]
			for(var/name in changed_fields)
				fields[name] = changed_fields[name]
			force_update_fields = FALSE
			return TRUE;

	//switch(action)

#if 0
/obj/machinery/computer/med_data/ui_interact(mob/user)
	. = ..()
	if(isliving(user))
		playsound(src, 'sound/machines/terminal_prompt_confirm.ogg', 50, FALSE)
	var/dat
	if(temp)
		dat = text("<TT>[temp]</TT><BR><BR><A href='?src=[REF(src)];temp=1'>Clear Screen</A>")
	else
		if(authenticated)
			switch(screen)
				if(1)
					dat += {"
<A href='?src=[REF(src)];search=1'>Search Records</A>
<BR><A href='?src=[REF(src)];screen=2'>List Records</A>
<BR>
<BR><A href='?src=[REF(src)];screen=5'>Virus Database</A>
<BR><A href='?src=[REF(src)];screen=6'>Medbot Tracking</A>
<BR>
<BR><A href='?src=[REF(src)];screen=3'>Record Maintenance</A>
<BR><A href='?src=[REF(src)];logout=1'>{Log Out}</A><BR>
"}
				if(2)
					dat += {"
</p>
<table style="text-align:center;" cellspacing="0" width="100%">
<tr>
<th>Records:</th>
</tr>
</table>
<table style="text-align:center;" border="1" cellspacing="0" width="100%">
<tr>
<th><A href='?src=[REF(src)];choice=Sorting;sort=name'>Name</A></th>
<th><A href='?src=[REF(src)];choice=Sorting;sort=id'>ID</A></th>
<th>Fingerprints (F) | DNA UE (D)</th>
<th><A href='?src=[REF(src)];choice=Sorting;sort=bloodtype'>Blood Type</A></th>
<th>Physical Status</th>
<th>Mental Status</th>
</tr>"}


					if(!isnull(GLOB.data_core.general))
						for(var/datum/data/record/R in sortRecord(GLOB.data_core.general, sortBy, order))
							var/blood_type = ""
							var/b_dna = ""
							for(var/datum/data/record/E in GLOB.data_core.medical)
								if((E.fields["name"] == R.fields["name"] && E.fields["id"] == R.fields["id"]))
									blood_type = E.fields["blood_type"]
									b_dna = E.fields["b_dna"]
							var/background

							if(R.fields["m_stat"] == "*Insane*" || R.fields["p_stat"] == "*Deceased*")
								background = "'background-color:#990000;'"
							else if(R.fields["p_stat"] == "*Unconscious*" || R.fields["m_stat"] == "*Unstable*")
								background = "'background-color:#CD6500;'"
							else if(R.fields["p_stat"] == "Physically Unfit" || R.fields["m_stat"] == "*Watch*")
								background = "'background-color:#3BB9FF;'"
							else
								background = "'background-color:#4F7529;'"

							dat += text("<tr style=[]><td><A href='?src=[REF(src)];d_rec=[]'>[]</a></td>", background, R.fields["id"], R.fields["name"])
							dat += text("<td>[]</td>", R.fields["id"])
							dat += text("<td><b>F:</b> []<BR><b>D:</b> []</td>", R.fields["fingerprint"], b_dna)
							dat += text("<td>[]</td>", blood_type)
							dat += text("<td>[]</td>", R.fields["p_stat"])
							dat += text("<td>[]</td></tr>", R.fields["m_stat"])
					dat += "</table><hr width='75%' />"
					dat += "<HR><A href='?src=[REF(src)];screen=1'>Back</A>"
				if(3)
					dat += "<B>Records Maintenance</B><HR>\n<A href='?src=[REF(src)];back=1'>Backup To Disk</A><BR>\n<A href='?src=[REF(src)];u_load=1'>Upload From Disk</A><BR>\n<A href='?src=[REF(src)];del_all=1'>Delete All Records</A><BR>\n<BR>\n<A href='?src=[REF(src)];screen=1'>Back</A>"
				if(4)

					dat += "<table><tr><td><b><font size='4'>Medical Record</font></b></td></tr>"
					if(active1 in GLOB.data_core.general)
						if(istype(active1.fields["photo_front"], /obj/item/photo))
							var/obj/item/photo/P1 = active1.fields["photo_front"]
							user << browse_rsc(P1.picture.picture_image, "photo_front")
						if(istype(active1.fields["photo_side"], /obj/item/photo))
							var/obj/item/photo/P2 = active1.fields["photo_side"]
							user << browse_rsc(P2.picture.picture_image, "photo_side")
						dat += "<tr><td>Name:</td><td>[active1.fields["name"]]</td>"
						dat += "<td><a href='?src=[REF(src)];field=show_photo_front'><img src=photo_front height=80 width=80 border=4></a></td>"
						dat += "<td><a href='?src=[REF(src)];field=show_photo_side'><img src=photo_side height=80 width=80 border=4></a></td></tr>"
						dat += "<tr><td>ID:</td><td>[active1.fields["id"]]</td></tr>"
						dat += "<tr><td>Gender:</td><td><A href='?src=[REF(src)];field=gender'>&nbsp;[active1.fields["gender"]]&nbsp;</A></td></tr>"
						dat += "<tr><td>Age:</td><td><A href='?src=[REF(src)];field=age'>&nbsp;[active1.fields["age"]]&nbsp;</A></td></tr>"
						dat += "<tr><td>Species:</td><td><A href='?src=[REF(src)];field=species'>&nbsp;[active1.fields["species"]]&nbsp;</A></td></tr>"
						dat += "<tr><td>Fingerprint:</td><td><A href='?src=[REF(src)];field=fingerprint'>&nbsp;[active1.fields["fingerprint"]]&nbsp;</A></td></tr>"
						dat += "<tr><td>Physical Status:</td><td><A href='?src=[REF(src)];field=p_stat'>&nbsp;[active1.fields["p_stat"]]&nbsp;</A></td></tr>"
						dat += "<tr><td>Mental Status:</td><td><A href='?src=[REF(src)];field=m_stat'>&nbsp;[active1.fields["m_stat"]]&nbsp;</A></td></tr>"
					else
						dat += "<tr><td>General Record Lost!</td></tr>"

					dat += "<tr><td><br><b><font size='4'>Medical Data</font></b></td></tr>"
					if(active2 in GLOB.data_core.medical)
						dat += "<tr><td>Blood Type:</td><td><A href='?src=[REF(src)];field=blood_type'>&nbsp;[active2.fields["blood_type"]]&nbsp;</A></td></tr>"
						dat += "<tr><td>DNA:</td><td><A href='?src=[REF(src)];field=b_dna'>&nbsp;[active2.fields["b_dna"]]&nbsp;</A></td></tr>"
						dat += "<tr><td><br>Minor Disabilities:</td><td><br><A href='?src=[REF(src)];field=mi_dis'>&nbsp;[active2.fields["mi_dis"]]&nbsp;</A></td></tr>"
						dat += "<tr><td>Details:</td><td><A href='?src=[REF(src)];field=mi_dis_d'>&nbsp;[active2.fields["mi_dis_d"]]&nbsp;</A></td></tr>"
						dat += "<tr><td><br>Major Disabilities:</td><td><br><A href='?src=[REF(src)];field=ma_dis'>&nbsp;[active2.fields["ma_dis"]]&nbsp;</A></td></tr>"
						dat += "<tr><td>Details:</td><td><A href='?src=[REF(src)];field=ma_dis_d'>&nbsp;[active2.fields["ma_dis_d"]]&nbsp;</A></td></tr>"
						dat += "<tr><td><br>Current Diseases:</td><td><br><A href='?src=[REF(src)];field=cdi'>&nbsp;[active2.fields["cdi"]]&nbsp;</A></td></tr>" //(per disease info placed in log/comment section)
						dat += "<tr><td>Details:</td><td><A href='?src=[REF(src)];field=cdi_d'>&nbsp;[active2.fields["cdi_d"]]&nbsp;</A></td></tr>"
						dat += "<tr><td><br>Important Notes:</td><td><br><A href='?src=[REF(src)];field=notes'>&nbsp;[active2.fields["notes"]]&nbsp;</A></td></tr>"
						dat += "<tr><td><br>Notes Cont'd:</td><td><br><A href='?src=[REF(src)];field=notes'>&nbsp;[active2.fields["notes_d"]]&nbsp;</A></td></tr>"

						dat += "<tr><td><br><b><font size='4'>Comments/Log</font></b></td></tr>"
						var/counter = 1
						while(active2.fields[text("com_[]", counter)])
							dat += "<tr><td>[active2.fields[text("com_[]", counter)]]</td></tr><tr><td><A href='?src=[REF(src)];del_c=[counter]'>Delete Entry</A></td></tr>"
							counter++
						dat += "<tr><td><A href='?src=[REF(src)];add_c=1'>Add Entry</A></td></tr>"

						dat += "<tr><td><br><A href='?src=[REF(src)];del_r=1'>Delete Record (Medical Only)</A></td></tr>"
					else
						dat += "<tr><td>Medical Record Lost!</tr>"
						dat += "<tr><td><br><A href='?src=[REF(src)];new=1'>New Record</A></td></tr>"
					dat += "<tr><td><A href='?src=[REF(src)];print_p=1'>Print Record</A></td></tr>"
					dat += "<tr><td><A href='?src=[REF(src)];screen=2'>Back</A></td></tr>"
					dat += "</table>"
				if(5)
					dat += "<CENTER><B>Virus Database</B></CENTER>"
					for(var/Dt in typesof(/datum/disease/))
						var/datum/disease/Dis = new Dt(0)
						if(istype(Dis, /datum/disease/advance))
							continue // TODO (tm): Add advance diseases to the virus database which no one uses.
						if(!Dis.desc)
							continue
						dat += "<br><a href='?src=[REF(src)];vir=[Dt]'>[Dis.name]</a>"
					dat += "<br><a href='?src=[REF(src)];screen=1'>Back</a>"
				if(6)
					dat += "<center><b>Medical Robot Monitor</b></center>"
					dat += "<a href='?src=[REF(src)];screen=1'>Back</a>"
					dat += "<br><b>Medical Robots:</b>"
					var/bdat = null
					for(var/mob/living/simple_animal/bot/medbot/M in GLOB.alive_mob_list)
						if(M.z != z)
							continue	//only find medibots on the same z-level as the computer
						var/turf/bl = get_turf(M)
						if(bl)	//if it can't find a turf for the medibot, then it probably shouldn't be showing up
							bdat += "[M.name] - <b>\[[bl.x],[bl.y]\]</b> - [M.on ? "Online" : "Offline"]<br>"
					if(!bdat)
						dat += "<br><center>None detected</center>"
					else
						dat += "<br>[bdat]"

				else
		else
			dat += "<A href='?src=[REF(src)];login=1'>{Log In}</A>"
	var/datum/browser/popup = new(user, "med_rec", "Medical Records Console", 600, 400)
	popup.set_content(dat)
	popup.open()

/obj/machinery/computer/med_data/Topic(href, href_list)
	. = ..()
	if(.)
		return .
	if(!(active1 in GLOB.data_core.general))
		active1 = null
	if(!(active2 in GLOB.data_core.medical))
		active2 = null

	if(usr.contents.Find(src) || (in_range(src, usr) && isturf(loc)) || issilicon(usr) || isAdminGhostAI(usr))
		usr.set_machine(src)
		if(href_list["temp"])
			temp = null
		else if(href_list["logout"])
			authenticated = null
			screen = null
			active1 = null
			active2 = null
			playsound(src, 'sound/machines/terminal_off.ogg', 50, FALSE)
		else if(href_list["choice"])
			// SORTING!
			if(href_list["choice"] == "Sorting")
				// Reverse the order if clicked twice
				if(sortBy == href_list["sort"])
					if(order == 1)
						order = -1
					else
						order = 1
				else
				// New sorting order!
					sortBy = href_list["sort"]
					order = initial(order)
		else if(href_list["login"])
			var/obj/item/card/id/I
			if(isliving(usr))
				var/mob/living/L = usr
				I = L.get_idcard(TRUE)
			if(issilicon(usr))
				active1 = null
				active2 = null
				authenticated = 1
				rank = "AI"
				screen = 1
			else if(isAdminGhostAI(usr))
				active1 = null
				active2 = null
				authenticated = 1
				rank = "Central Command"
				screen = 1
			else if(istype(I) && check_access(I))
				active1 = null
				active2 = null
				authenticated = I.registered_name
				rank = I.assignment
				screen = 1
			else
				to_chat(usr, "<span class='danger'>Unauthorized access.</span>")
			playsound(src, 'sound/machines/terminal_on.ogg', 50, FALSE)
		if(authenticated)
			if(href_list["screen"])
				screen = text2num(href_list["screen"])
				if(screen < 1)
					screen = 1

				active1 = null
				active2 = null

			else if(href_list["vir"])
				var/type = href_list["vir"]
				var/datum/disease/Dis = new type(0)
				var/AfS = ""
				for(var/mob/M in Dis.viable_mobtypes)
					AfS += " [initial(M.name)];"
				temp = {"<b>Name:</b> [Dis.name]
<BR><b>Number of stages:</b> [Dis.max_stages]
<BR><b>Spread:</b> [Dis.spread_text] Transmission
<BR><b>Possible Cure:</b> [(Dis.cure_text||"none")]
<BR><b>Affected Lifeforms:</b>[AfS]
<BR>
<BR><b>Notes:</b> [Dis.desc]
<BR>
<BR><b>Severity:</b> [Dis.severity]"}

			else if(href_list["del_all"])
				temp = "Are you sure you wish to delete all records?<br>\n\t<A href='?src=[REF(src)];temp=1;del_all2=1'>Yes</A><br>\n\t<A href='?src=[REF(src)];temp=1'>No</A><br>"

			else if(href_list["del_all2"])
				investigate_log("[key_name(usr)] has deleted all medical records.", INVESTIGATE_RECORDS)
				GLOB.data_core.medical.Cut()
				temp = "All records deleted."

			else if(href_list["field"])
				var/a1 = active1
				var/a2 = active2
				switch(href_list["field"])
					if("fingerprint")
						if(active1)
							var/t1 = stripped_input("Please input fingerprint hash:", "Med. records", active1.fields["fingerprint"], null)
							if(!canUseMedicalRecordsConsole(usr, t1, a1))
								return
							active1.fields["fingerprint"] = t1
					if("gender")
						if(active1)
							if(active1.fields["gender"] == "Male")
								active1.fields["gender"] = "Female"
							else if(active1.fields["gender"] == "Female")
								active1.fields["gender"] = "Other"
							else
								active1.fields["gender"] = "Male"
					if("age")
						if(active1)
							var/t1 = input("Please input age:", "Med. records", active1.fields["age"], null)  as num
							if(!canUseMedicalRecordsConsole(usr, t1, a1))
								return
							active1.fields["age"] = t1
					if("species")
						if(active1)
							var/t1 = stripped_input("Please input species name", "Med. records", active1.fields["species"], null)
							if(!canUseMedicalRecordsConsole(usr, t1, a1))
								return
							active1.fields["species"] = t1
					if("mi_dis")
						if(active2)
							var/t1 = stripped_input("Please input minor disabilities list:", "Med. records", active2.fields["mi_dis"], null)
							if(!canUseMedicalRecordsConsole(usr, t1, null, a2))
								return
							active2.fields["mi_dis"] = t1
					if("mi_dis_d")
						if(active2)
							var/t1 = stripped_input("Please summarize minor dis.:", "Med. records", active2.fields["mi_dis_d"], null)
							if(!canUseMedicalRecordsConsole(usr, t1, null, a2))
								return
							active2.fields["mi_dis_d"] = t1
					if("ma_dis")
						if(active2)
							var/t1 = stripped_input("Please input major disabilities list:", "Med. records", active2.fields["ma_dis"], null)
							if(!canUseMedicalRecordsConsole(usr, t1, null, a2))
								return
							active2.fields["ma_dis"] = t1
					if("ma_dis_d")
						if(active2)
							var/t1 = stripped_input("Please summarize major dis.:", "Med. records", active2.fields["ma_dis_d"], null)
							if(!canUseMedicalRecordsConsole(usr, t1, null, a2))
								return
							active2.fields["ma_dis_d"] = t1
					if("alg")
						if(active2)
							var/t1 = stripped_input("Please state allergies:", "Med. records", active2.fields["alg"], null)
							if(!canUseMedicalRecordsConsole(usr, t1, null, a2))
								return
							active2.fields["alg"] = t1
					if("alg_d")
						if(active2)
							var/t1 = stripped_input("Please summarize allergies:", "Med. records", active2.fields["alg_d"], null)
							if(!canUseMedicalRecordsConsole(usr, t1, null, a2))
								return
							active2.fields["alg_d"] = t1
					if("cdi")
						if(active2)
							var/t1 = stripped_input("Please state diseases:", "Med. records", active2.fields["cdi"], null)
							if(!canUseMedicalRecordsConsole(usr, t1, null, a2))
								return
							active2.fields["cdi"] = t1
					if("cdi_d")
						if(active2)
							var/t1 = stripped_input("Please summarize diseases:", "Med. records", active2.fields["cdi_d"], null)
							if(!canUseMedicalRecordsConsole(usr, t1, null, a2))
								return
							active2.fields["cdi_d"] = t1
					if("notes")
						if(active2)
							var/t1 = stripped_input("Please summarize notes:", "Med. records", active2.fields["notes"], null)
							if(!canUseMedicalRecordsConsole(usr, t1, null, a2))
								return
							active2.fields["notes"] = t1
					if("p_stat")
						if(active1)
							temp = "<B>Physical Condition:</B><BR>\n\t<A href='?src=[REF(src)];temp=1;p_stat=deceased'>*Deceased*</A><BR>\n\t<A href='?src=[REF(src)];temp=1;p_stat=unconscious'>*Unconscious*</A><BR>\n\t<A href='?src=[REF(src)];temp=1;p_stat=active'>Active</A><BR>\n\t<A href='?src=[REF(src)];temp=1;p_stat=unfit'>Physically Unfit</A><BR>"
					if("m_stat")
						if(active1)
							temp = "<B>Mental Condition:</B><BR>\n\t<A href='?src=[REF(src)];temp=1;m_stat=insane'>*Insane*</A><BR>\n\t<A href='?src=[REF(src)];temp=1;m_stat=unstable'>*Unstable*</A><BR>\n\t<A href='?src=[REF(src)];temp=1;m_stat=watch'>*Watch*</A><BR>\n\t<A href='?src=[REF(src)];temp=1;m_stat=stable'>Stable</A><BR>"
					if("blood_type")
						if(active2)
							temp = "<B>Blood Type:</B><BR>\n\t<A href='?src=[REF(src)];temp=1;blood_type=an'>A-</A> <A href='?src=[REF(src)];temp=1;blood_type=ap'>A+</A><BR>\n\t<A href='?src=[REF(src)];temp=1;blood_type=bn'>B-</A> <A href='?src=[REF(src)];temp=1;blood_type=bp'>B+</A><BR>\n\t<A href='?src=[REF(src)];temp=1;blood_type=abn'>AB-</A> <A href='?src=[REF(src)];temp=1;blood_type=abp'>AB+</A><BR>\n\t<A href='?src=[REF(src)];temp=1;blood_type=on'>O-</A> <A href='?src=[REF(src)];temp=1;blood_type=op'>O+</A><BR>"
					if("b_dna")
						if(active2)
							var/t1 = stripped_input("Please input DNA hash:", "Med. records", active2.fields["b_dna"], null)
							if(!canUseMedicalRecordsConsole(usr, t1, null, a2))
								return
							active2.fields["b_dna"] = t1
					if("show_photo_front")
						if(active1)
							if(active1.fields["photo_front"])
								if(istype(active1.fields["photo_front"], /obj/item/photo))
									var/obj/item/photo/P = active1.fields["photo_front"]
									P.show(usr)
					if("show_photo_side")
						if(active1)
							if(active1.fields["photo_side"])
								if(istype(active1.fields["photo_side"], /obj/item/photo))
									var/obj/item/photo/P = active1.fields["photo_side"]
									P.show(usr)
					else

			else if(href_list["p_stat"])
				if(active1)
					switch(href_list["p_stat"])
						if("deceased")
							active1.fields["p_stat"] = "*Deceased*"
						if("unconscious")
							active1.fields["p_stat"] = "*Unconscious*"
						if("active")
							active1.fields["p_stat"] = "Active"
						if("unfit")
							active1.fields["p_stat"] = "Physically Unfit"

			else if(href_list["m_stat"])
				if(active1)
					switch(href_list["m_stat"])
						if("insane")
							active1.fields["m_stat"] = "*Insane*"
						if("unstable")
							active1.fields["m_stat"] = "*Unstable*"
						if("watch")
							active1.fields["m_stat"] = "*Watch*"
						if("stable")
							active1.fields["m_stat"] = "Stable"


			else if(href_list["blood_type"])
				if(active2)
					switch(href_list["blood_type"])
						if("an")
							active2.fields["blood_type"] = "A-"
						if("bn")
							active2.fields["blood_type"] = "B-"
						if("abn")
							active2.fields["blood_type"] = "AB-"
						if("on")
							active2.fields["blood_type"] = "O-"
						if("ap")
							active2.fields["blood_type"] = "A+"
						if("bp")
							active2.fields["blood_type"] = "B+"
						if("abp")
							active2.fields["blood_type"] = "AB+"
						if("op")
							active2.fields["blood_type"] = "O+"


			else if(href_list["del_r"])
				if(active2)
					temp = "Are you sure you wish to delete the record (Medical Portion Only)?<br>\n\t<A href='?src=[REF(src)];temp=1;del_r2=1'>Yes</A><br>\n\t<A href='?src=[REF(src)];temp=1'>No</A><br>"

			else if(href_list["del_r2"])
				investigate_log("[key_name(usr)] has deleted the medical records for [active1.fields["name"]].", INVESTIGATE_RECORDS)
				if(active2)
					qdel(active2)
					active2 = null

			else if(href_list["d_rec"])
				active1 = find_record("id", href_list["d_rec"], GLOB.data_core.general)
				if(active1)
					active2 = find_record("id", href_list["d_rec"], GLOB.data_core.medical)
				if(!active2)
					active1 = null
				screen = 4

			else if(href_list["new"])
				if((istype(active1, /datum/data/record) && !( istype(active2, /datum/data/record) )))
					var/datum/data/record/R = new /datum/data/record(  )
					R.fields["name"] = active1.fields["name"]
					R.fields["id"] = active1.fields["id"]
					R.name = text("Medical Record #[]", R.fields["id"])
					R.fields["blood_type"] = "Unknown"
					R.fields["b_dna"] = "Unknown"
					R.fields["mi_dis"] = "None"
					R.fields["mi_dis_d"] = "No minor disabilities have been diagnosed."
					R.fields["ma_dis"] = "None"
					R.fields["ma_dis_d"] = "No major disabilities have been diagnosed."
					R.fields["alg"] = "None"
					R.fields["alg_d"] = "No allergies have been detected in this patient."
					R.fields["cdi"] = "None"
					R.fields["cdi_d"] = "No diseases have been diagnosed at the moment."
					R.fields["notes"] = "No notes."
					GLOB.data_core.medical += R
					active2 = R
					screen = 4

			else if(href_list["add_c"])
				if(!(active2 in GLOB.data_core.medical))
					return
				var/a2 = active2
				var/t1 = stripped_multiline_input("Add Comment:", "Med. records", null, null)
				if(!canUseMedicalRecordsConsole(usr, t1, null, a2))
					return
				var/counter = 1
				while(active2.fields[text("com_[]", counter)])
					counter++
				active2.fields[text("com_[]", counter)] = text("Made by [] ([]) on [] [], []<BR>[]", authenticated, rank, station_time_timestamp(), time2text(world.realtime, "MMM DD"), GLOB.year_integer+540, t1)

			else if(href_list["del_c"])
				if((istype(active2, /datum/data/record) && active2.fields[text("com_[]", href_list["del_c"])]))
					active2.fields[text("com_[]", href_list["del_c"])] = "<B>Deleted</B>"

			else if(href_list["search"])
				var/t1 = stripped_input(usr, "Search String: (Name, DNA, or ID)", "Med. records")
				if(!canUseMedicalRecordsConsole(usr, t1))
					return
				active1 = null
				active2 = null
				t1 = lowertext(t1)
				for(var/datum/data/record/R in GLOB.data_core.medical)
					if((lowertext(R.fields["name"]) == t1 || t1 == lowertext(R.fields["id"]) || t1 == lowertext(R.fields["b_dna"])))
						active2 = R
					else
						//Foreach continue //goto(3229)
				if(!( active2 ))
					temp = text("Could not locate record [].", sanitize(t1))
				else
					for(var/datum/data/record/E in GLOB.data_core.general)
						if((E.fields["name"] == active2.fields["name"] || E.fields["id"] == active2.fields["id"]))
							active1 = E
						else
							//Foreach continue //goto(3334)
					screen = 4

			else if(href_list["print_p"])
				if(!( printing ))
					printing = 1
					GLOB.data_core.medicalPrintCount++
					playsound(loc, 'sound/items/poster_being_created.ogg', 100, TRUE)
					sleep(30)
					var/obj/item/paper/P = new /obj/item/paper( loc )
					P.info = "<CENTER><B>Medical Record - (MR-[GLOB.data_core.medicalPrintCount])</B></CENTER><BR>"
					if(active1 in GLOB.data_core.general)
						P.info += text("Name: [] ID: []<BR>\nGender: []<BR>\nAge: []<BR>", active1.fields["name"], active1.fields["id"], active1.fields["gender"], active1.fields["age"])
						P.info += "\nSpecies: [active1.fields["species"]]<BR>"
						P.info += text("\nFingerprint: []<BR>\nPhysical Status: []<BR>\nMental Status: []<BR>", active1.fields["fingerprint"], active1.fields["p_stat"], active1.fields["m_stat"])
					else
						P.info += "<B>General Record Lost!</B><BR>"
					if(active2 in GLOB.data_core.medical)
						P.info += text("<BR>\n<CENTER><B>Medical Data</B></CENTER><BR>\nBlood Type: []<BR>\nDNA: []<BR>\n<BR>\nMinor Disabilities: []<BR>\nDetails: []<BR>\n<BR>\nMajor Disabilities: []<BR>\nDetails: []<BR>\n<BR>\nAllergies: []<BR>\nDetails: []<BR>\n<BR>\nCurrent Diseases: [] (per disease info placed in log/comment section)<BR>\nDetails: []<BR>\n<BR>\nImportant Notes:<BR>\n\t[]<BR>\n<BR>\n<CENTER><B>Comments/Log</B></CENTER><BR>", active2.fields["blood_type"], active2.fields["b_dna"], active2.fields["mi_dis"], active2.fields["mi_dis_d"], active2.fields["ma_dis"], active2.fields["ma_dis_d"], active2.fields["alg"], active2.fields["alg_d"], active2.fields["cdi"], active2.fields["cdi_d"], active2.fields["notes"])
						var/counter = 1
						while(active2.fields[text("com_[]", counter)])
							P.info += text("[]<BR>", active2.fields[text("com_[]", counter)])
							counter++
						P.name = text("MR-[] '[]'", GLOB.data_core.medicalPrintCount, active1.fields["name"])
					else
						P.info += "<B>Medical Record Lost!</B><BR>"
						P.name = text("MR-[] '[]'", GLOB.data_core.medicalPrintCount, "Record Lost")
					P.info += "</TT>"
					P.update_icon()
					printing = null

	add_fingerprint(usr)
	updateUsrDialog()
	return

/obj/machinery/computer/med_data/emp_act(severity)
	. = ..()
	if(!(machine_stat & (BROKEN|NOPOWER)) && !(. & EMP_PROTECT_SELF))
		for(var/datum/data/record/R in GLOB.data_core.medical)
			if(prob(10/severity))
				switch(rand(1,6))
					if(1)
						if(prob(10))
							R.fields["name"] = random_unique_lizard_name(R.fields["gender"],1)
						else
							R.fields["name"] = random_unique_name(R.fields["gender"],1)
					if(2)
						R.fields["gender"]	= pick("Male", "Female", "Other")
					if(3)
						R.fields["age"] = rand(AGE_MIN, AGE_MAX)
					if(4)
						R.fields["blood_type"] = random_blood_type()
					if(5)
						R.fields["p_stat"] = pick("*Unconscious*", "Active", "Physically Unfit")
					if(6)
						R.fields["m_stat"] = pick("*Insane*", "*Unstable*", "*Watch*", "Stable")
				continue

			else if(prob(1))
				qdel(R)
				continue
#endif
/obj/machinery/computer/med_data/proc/canUseMedicalRecordsConsole(mob/user, message = 1, record1, record2)
	if(user && message && authenticated)
		if(user.canUseTopic(src, !issilicon(user)))
			if(!record1 || record1 == active1)
				if(!record2 || record2 == active2)
					return TRUE
	return FALSE

/obj/machinery/computer/med_data/laptop
	name = "medical laptop"
	desc = "A cheap Nanotrasen medical laptop, it functions as a medical records computer. It's bolted to the table."
	icon_state = "laptop"
	icon_screen = "medlaptop"
	icon_keyboard = "laptop_key"
	pass_flags = PASSTABLE
