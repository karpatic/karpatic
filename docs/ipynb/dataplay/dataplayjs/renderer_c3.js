(function(t,e){var n;return n=function(t){return null==t&&(t={}),function(n,a){var r,l,o,i,s,c,u,h,g,d,p,f,y,v,m,x,b,z,C,j,A,k,w,S,B,E,H,N,_,F,K,O,W,L,R,U,q,D,G,I,J,M,P,Q,T,V,X,Y,Z,$,tt,et,nt,at,rt,lt,ot,it;if(b={localeStrings:{vs:"vs",by:"by"},c3:{}},null==(o=(a=Object.assign({},b,a)).c3).size&&(o.size={}),null==(i=a.c3.size).width&&(i.width=window.innerWidth/1.4),null==(s=a.c3.size).height&&(s.height=window.innerHeight/1.4-50),null==t.type&&(t.type="line"),null==t.horizontal&&(t.horizontal=!1),null==t.stacked&&(t.stacked=!1),0===(X=n.getRowKeys()).length&&X.push([]),0===(v=n.getColKeys()).length&&v.push([]),w=function(){var t,e,n;for(n=[],t=0,e=v.length;t<e;t++)A=v[t],n.push(A.join("-"));return n}(),P=0,C=n.aggregatorName,n.valAttrs.length&&(C+="("+n.valAttrs.join(", ")+")"),"scatter"===t.type)for(Z={x:{},y:{},t:{}},nt=null!=(q=(l=n.rowAttrs.concat(n.colAttrs))[0])?q:"",k=null!=(D=l[1])?D:"",j=l.slice(2).join("-"),et=nt,""!==k&&(et+=" "+a.localeStrings.vs+" "+k),""!==j&&(et+=" "+a.localeStrings.by+" "+j),S=0,N=X.length;S<N;S++)for(V=X[S],B=0,_=v.length;B<_;B++)y=v[B],null!=(r=n.getAggregator(V,y)).value()&&(rt=V.concat(y),""===($=rt.slice(2).join("-"))&&($="series"),null==(c=Z.x)[$]&&(c[$]=[]),null==(u=Z.y)[$]&&(u[$]=[]),it=null!=(G=rt[0])?G:0,lt=null!=(I=rt[1])?I:0,Z.y[$].push(it),Z.x[$].push(lt),null==(h=Z.t)[$]&&(h[$]={}),null==(g=Z.t[$])[lt]&&(g[lt]={}),Z.t[$][lt][it]=r.value());else{for(L=0,E=0,F=w.length;E<F;E++)L+=(lt=w[E]).length;for(L>50&&(P=45),m=[],H=0,K=X.length;H<K;H++){for(Q=[""===(T=(V=X[H]).join("-"))?C:T],W=0,O=v.length;W<O;W++)y=v[W],at=parseFloat(n.getAggregator(V,y).value()),isFinite(at)?Q.push(at):Q.push(null);m.push(Q)}nt=C,t.horizontal?(k=n.rowAttrs.join("-"),j=n.colAttrs.join("-")):(k=n.colAttrs.join("-"),j=n.rowAttrs.join("-")),et=C,""!==k&&(et+=" "+a.localeStrings.vs+" "+k),""!==j&&(et+=" "+a.localeStrings.by+" "+j)}if((tt=document.createElement("p")).style.textAlign="center",tt.style.fontWeight="bold",tt.textContent=et,z=n.getAggregator([],[]).format,U={axis:{rotated:t.horizontal,y:{label:nt,tick:{}},x:{label:k,tick:{rotate:P,multiline:!1}}},data:{type:t.type,order:null},tooltip:{grouped:!1},color:{pattern:["#3366cc","#dc3912","#ff9900","#109618","#990099","#0099c6","#dd4477","#66aa00","#b82e2e","#316395","#994499","#22aa99","#aaaa11","#6633cc","#e67300","#8b0707","#651067","#329262","#5574a6","#3b3eac"]}},U=Object.assign({},U,a.c3),"scatter"===t.type){for(Y in ot={},R=0,x=[],Z.x)R+=1,ot[Y]=Y+"_x",x.push([Y+"_x"].concat(Z.x[Y])),x.push([Y].concat(Z.y[Y]));U.data.xs=ot,U.data.columns=x,U.axis.x.tick={fit:!1},1===R&&(U.legend={show:!1}),U.tooltip.format={title:function(){return C},name:function(){return""},value:function(t,e,n,a,r){var l;return l=r[0],$=l.name,it=l.value,lt=l.x,z(Z.t[$][lt][it])}}}else U.axis.x.type="category",null==(d=U.axis.y.tick).format&&(d.format=function(t){return z(t)}),U.tooltip.format={value:function(t){return z(t)}},t.horizontal?(f=function(){var t,e,n;for(n=[],e=0,t=m.length;e<t;e++)p=m[e],n.push(p.shift());return n}(),1===f.length&&f[0]===C&&(f=[""]),U.axis.x.categories=f,1===w.length&&""===w[0]&&(w=[C]),m.unshift(w),U.data.rows=m):(U.axis.x.categories=w,U.data.columns=m);return t.stacked&&(t.horizontal?U.data.groups=[function(){var t,e,n;for(n=[],e=0,t=v.length;e<t;e++)lt=v[e],n.push(lt.join("-"));return n}()]:U.data.groups=[function(){var t,e,n;for(n=[],e=0,t=X.length;e<t;e++)lt=X[e],n.push(lt.join("-"));return n}()]),(J=document.createElement("div")).style.display="none",document.body.appendChild(J),M=document.createElement("div"),J.appendChild(M),U.bindto=M,e.generate(U),M.parentNode.removeChild(M),J.parentNode.removeChild(J),document.createElement("div").appendChild(tt,M)}},t.pivotUtilities.c3_renderers={"Horizontal Bar Chart":n({type:"bar",horizontal:!0}),"Horizontal Stacked Bar Chart":n({type:"bar",stacked:!0,horizontal:!0}),"Bar Chart":n({type:"bar"}),"Stacked Bar Chart":n({type:"bar",stacked:!0}),"Line Chart":n(),"Area Chart":n({type:"area",stacked:!0}),"Scatter Chart":n({type:"scatter"})}}).call(this);