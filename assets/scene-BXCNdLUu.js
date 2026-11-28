import{s as Os}from"./JourneyPage-HotBo0rY.js";import"./ui-BHJBWm46.js";import"./index-BHVYf4K_.js";import"./vendor-CPMi8Tjl.js";import"./state-DgZ8PMUZ.js";import"./data-BDQN7YrB.js";import"./projectStore-BiGH0ypv.js";import"./journeyPersistence-DmudiAsA.js";import"./useQuery-CPfgM3HO.js";import"./pdfToImages-BA6vZqy7.js";import"./styleMoodboards-Dl4Tgwh6.js";import"./aiErrorMessage-BN134qpM.js";import"./imageOptimization-iV133L7V.js";/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const to="160",Kc=0,yo=1,jc=2,$a=1,Br=2,pn=3,Ln=0,Le=1,Ne=2,wn=0,gi=1,Eo=2,To=3,Ao=4,$c=5,Vn=100,Qc=101,tl=102,bo=103,wo=104,el=200,nl=201,il=202,rl=203,Bs=204,zs=205,sl=206,ol=207,al=208,cl=209,ll=210,hl=211,ul=212,fl=213,dl=214,pl=0,ml=1,_l=2,Cr=3,gl=4,vl=5,xl=6,Ml=7,Qa=0,Sl=1,yl=2,gn=0,El=1,Tl=2,Al=3,zr=4,bl=5,wl=6,tc=300,Mi=301,Si=302,Gs=303,Hs=304,Gr=306,Pr=1e3,Qe=1001,Vs=1002,Ce=1003,Ro=1004,ts=1005,Xe=1006,Rl=1007,Xi=1008,Rn=1009,Cl=1010,Pl=1011,eo=1012,ec=1013,An=1014,bn=1015,qi=1016,nc=1017,ic=1018,Wn=1020,Ll=1021,tn=1023,Dl=1024,Ul=1025,Xn=1026,yi=1027,Il=1028,rc=1029,Nl=1030,sc=1031,oc=1033,es=33776,ns=33777,is=33778,rs=33779,Co=35840,Po=35841,Lo=35842,Do=35843,ac=36196,Uo=37492,Io=37496,No=37808,Fo=37809,Oo=37810,Bo=37811,zo=37812,Go=37813,Ho=37814,Vo=37815,ko=37816,Wo=37817,Xo=37818,qo=37819,Yo=37820,Zo=37821,ss=36492,Jo=36494,Ko=36495,Fl=36283,jo=36284,$o=36285,Qo=36286,cc=3e3,qn=3001,Ol=3200,Bl=3201,lc=0,zl=1,qe="",he="srgb",on="srgb-linear",no="display-p3",Hr="display-p3-linear",Lr="linear",ie="srgb",Dr="rec709",Ur="p3",jn=7680,ta=519,Gl=512,Hl=513,Vl=514,hc=515,kl=516,Wl=517,Xl=518,ql=519,ea=35044,na="300 es",ks=1035,_n=2e3,Ir=2001;class bi{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const i=this._listeners;return i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const r=this._listeners[t];if(r!==void 0){const s=r.indexOf(e);s!==-1&&r.splice(s,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const i=this._listeners[t.type];if(i!==void 0){t.target=this;const r=i.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,t);t.target=null}}}const Te=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],os=Math.PI/180,Ws=180/Math.PI;function wi(){const n=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Te[n&255]+Te[n>>8&255]+Te[n>>16&255]+Te[n>>24&255]+"-"+Te[t&255]+Te[t>>8&255]+"-"+Te[t>>16&15|64]+Te[t>>24&255]+"-"+Te[e&63|128]+Te[e>>8&255]+"-"+Te[e>>16&255]+Te[e>>24&255]+Te[i&255]+Te[i>>8&255]+Te[i>>16&255]+Te[i>>24&255]).toLowerCase()}function xe(n,t,e){return Math.max(t,Math.min(e,n))}function Yl(n,t){return(n%t+t)%t}function as(n,t,e){return(1-e)*n+e*t}function ia(n){return(n&n-1)===0&&n!==0}function Xs(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function Ui(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function Ue(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}class st{constructor(t=0,e=0){st.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,i=this.y,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6],this.y=r[1]*e+r[4]*i+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(xe(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const i=Math.cos(e),r=Math.sin(e),s=this.x-t.x,o=this.y-t.y;return this.x=s*i-o*r+t.x,this.y=s*r+o*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Wt{constructor(t,e,i,r,s,o,a,c,l){Wt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,r,s,o,a,c,l)}set(t,e,i,r,s,o,a,c,l){const h=this.elements;return h[0]=t,h[1]=r,h[2]=a,h[3]=e,h[4]=s,h[5]=c,h[6]=i,h[7]=o,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,s=this.elements,o=i[0],a=i[3],c=i[6],l=i[1],h=i[4],u=i[7],p=i[2],d=i[5],_=i[8],g=r[0],m=r[3],f=r[6],x=r[1],v=r[4],A=r[7],N=r[2],w=r[5],R=r[8];return s[0]=o*g+a*x+c*N,s[3]=o*m+a*v+c*w,s[6]=o*f+a*A+c*R,s[1]=l*g+h*x+u*N,s[4]=l*m+h*v+u*w,s[7]=l*f+h*A+u*R,s[2]=p*g+d*x+_*N,s[5]=p*m+d*v+_*w,s[8]=p*f+d*A+_*R,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[1],r=t[2],s=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8];return e*o*h-e*a*l-i*s*h+i*a*c+r*s*l-r*o*c}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],s=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8],u=h*o-a*l,p=a*c-h*s,d=l*s-o*c,_=e*u+i*p+r*d;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const g=1/_;return t[0]=u*g,t[1]=(r*l-h*i)*g,t[2]=(a*i-r*o)*g,t[3]=p*g,t[4]=(h*e-r*c)*g,t[5]=(r*s-a*e)*g,t[6]=d*g,t[7]=(i*c-l*e)*g,t[8]=(o*e-i*s)*g,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,r,s,o,a){const c=Math.cos(s),l=Math.sin(s);return this.set(i*c,i*l,-i*(c*o+l*a)+o+t,-r*l,r*c,-r*(-l*o+c*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(cs.makeScale(t,e)),this}rotate(t){return this.premultiply(cs.makeRotation(-t)),this}translate(t,e){return this.premultiply(cs.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<9;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const cs=new Wt;function uc(n){for(let t=n.length-1;t>=0;--t)if(n[t]>=65535)return!0;return!1}function Nr(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Zl(){const n=Nr("canvas");return n.style.display="block",n}const ra={};function Hi(n){n in ra||(ra[n]=!0,console.warn(n))}const sa=new Wt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),oa=new Wt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),ir={[on]:{transfer:Lr,primaries:Dr,toReference:n=>n,fromReference:n=>n},[he]:{transfer:ie,primaries:Dr,toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[Hr]:{transfer:Lr,primaries:Ur,toReference:n=>n.applyMatrix3(oa),fromReference:n=>n.applyMatrix3(sa)},[no]:{transfer:ie,primaries:Ur,toReference:n=>n.convertSRGBToLinear().applyMatrix3(oa),fromReference:n=>n.applyMatrix3(sa).convertLinearToSRGB()}},Jl=new Set([on,Hr]),jt={enabled:!0,_workingColorSpace:on,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!Jl.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,t,e){if(this.enabled===!1||t===e||!t||!e)return n;const i=ir[t].toReference,r=ir[e].fromReference;return r(i(n))},fromWorkingColorSpace:function(n,t){return this.convert(n,this._workingColorSpace,t)},toWorkingColorSpace:function(n,t){return this.convert(n,t,this._workingColorSpace)},getPrimaries:function(n){return ir[n].primaries},getTransfer:function(n){return n===qe?Lr:ir[n].transfer}};function vi(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function ls(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let $n;class fc{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{$n===void 0&&($n=Nr("canvas")),$n.width=t.width,$n.height=t.height;const i=$n.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),e=$n}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Nr("canvas");e.width=t.width,e.height=t.height;const i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const r=i.getImageData(0,0,t.width,t.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=vi(s[o]/255)*255;return i.putImageData(r,0,0),e}else if(t.data){const e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(vi(e[i]/255)*255):e[i]=vi(e[i]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Kl=0;class dc{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Kl++}),this.uuid=wi(),this.data=t,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(hs(r[o].image)):s.push(hs(r[o]))}else s=hs(r);i.url=s}return e||(t.images[this.uuid]=i),i}}function hs(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?fc.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let jl=0;class Fe extends bi{constructor(t=Fe.DEFAULT_IMAGE,e=Fe.DEFAULT_MAPPING,i=Qe,r=Qe,s=Xe,o=Xi,a=tn,c=Rn,l=Fe.DEFAULT_ANISOTROPY,h=qe){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:jl++}),this.uuid=wi(),this.name="",this.source=new dc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new st(0,0),this.repeat=new st(1,1),this.center=new st(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Wt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof h=="string"?this.colorSpace=h:(Hi("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=h===qn?he:qe),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==tc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Pr:t.x=t.x-Math.floor(t.x);break;case Qe:t.x=t.x<0?0:1;break;case Vs:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Pr:t.y=t.y-Math.floor(t.y);break;case Qe:t.y=t.y<0?0:1;break;case Vs:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return Hi("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===he?qn:cc}set encoding(t){Hi("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=t===qn?he:qe}}Fe.DEFAULT_IMAGE=null;Fe.DEFAULT_MAPPING=tc;Fe.DEFAULT_ANISOTROPY=1;class re{constructor(t=0,e=0,i=0,r=1){re.prototype.isVector4=!0,this.x=t,this.y=e,this.z=i,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,r){return this.x=t,this.y=e,this.z=i,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,s=this.w,o=t.elements;return this.x=o[0]*e+o[4]*i+o[8]*r+o[12]*s,this.y=o[1]*e+o[5]*i+o[9]*r+o[13]*s,this.z=o[2]*e+o[6]*i+o[10]*r+o[14]*s,this.w=o[3]*e+o[7]*i+o[11]*r+o[15]*s,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,r,s;const c=t.elements,l=c[0],h=c[4],u=c[8],p=c[1],d=c[5],_=c[9],g=c[2],m=c[6],f=c[10];if(Math.abs(h-p)<.01&&Math.abs(u-g)<.01&&Math.abs(_-m)<.01){if(Math.abs(h+p)<.1&&Math.abs(u+g)<.1&&Math.abs(_+m)<.1&&Math.abs(l+d+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const v=(l+1)/2,A=(d+1)/2,N=(f+1)/2,w=(h+p)/4,R=(u+g)/4,C=(_+m)/4;return v>A&&v>N?v<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(v),r=w/i,s=R/i):A>N?A<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(A),i=w/r,s=C/r):N<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(N),i=R/s,r=C/s),this.set(i,r,s,e),this}let x=Math.sqrt((m-_)*(m-_)+(u-g)*(u-g)+(p-h)*(p-h));return Math.abs(x)<.001&&(x=1),this.x=(m-_)/x,this.y=(u-g)/x,this.z=(p-h)/x,this.w=Math.acos((l+d+f-1)/2),this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class $l extends bi{constructor(t=1,e=1,i={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new re(0,0,t,e),this.scissorTest=!1,this.viewport=new re(0,0,t,e);const r={width:t,height:e,depth:1};i.encoding!==void 0&&(Hi("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),i.colorSpace=i.encoding===qn?he:qe),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Xe,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},i),this.texture=new Fe(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=i.generateMipmaps,this.texture.internalFormat=i.internalFormat,this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}setSize(t,e,i=1){(this.width!==t||this.height!==e||this.depth!==i)&&(this.width=t,this.height=e,this.depth=i,this.texture.image.width=t,this.texture.image.height=e,this.texture.image.depth=i,this.dispose()),this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.texture=t.texture.clone(),this.texture.isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new dc(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Dn extends $l{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}}class pc extends Fe{constructor(t=null,e=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=Ce,this.minFilter=Ce,this.wrapR=Qe,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ql extends Fe{constructor(t=null,e=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=Ce,this.minFilter=Ce,this.wrapR=Qe,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class $i{constructor(t=0,e=0,i=0,r=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=r}static slerpFlat(t,e,i,r,s,o,a){let c=i[r+0],l=i[r+1],h=i[r+2],u=i[r+3];const p=s[o+0],d=s[o+1],_=s[o+2],g=s[o+3];if(a===0){t[e+0]=c,t[e+1]=l,t[e+2]=h,t[e+3]=u;return}if(a===1){t[e+0]=p,t[e+1]=d,t[e+2]=_,t[e+3]=g;return}if(u!==g||c!==p||l!==d||h!==_){let m=1-a;const f=c*p+l*d+h*_+u*g,x=f>=0?1:-1,v=1-f*f;if(v>Number.EPSILON){const N=Math.sqrt(v),w=Math.atan2(N,f*x);m=Math.sin(m*w)/N,a=Math.sin(a*w)/N}const A=a*x;if(c=c*m+p*A,l=l*m+d*A,h=h*m+_*A,u=u*m+g*A,m===1-a){const N=1/Math.sqrt(c*c+l*l+h*h+u*u);c*=N,l*=N,h*=N,u*=N}}t[e]=c,t[e+1]=l,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,i,r,s,o){const a=i[r],c=i[r+1],l=i[r+2],h=i[r+3],u=s[o],p=s[o+1],d=s[o+2],_=s[o+3];return t[e]=a*_+h*u+c*d-l*p,t[e+1]=c*_+h*p+l*u-a*d,t[e+2]=l*_+h*d+a*p-c*u,t[e+3]=h*_-a*u-c*p-l*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,r){return this._x=t,this._y=e,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const i=t._x,r=t._y,s=t._z,o=t._order,a=Math.cos,c=Math.sin,l=a(i/2),h=a(r/2),u=a(s/2),p=c(i/2),d=c(r/2),_=c(s/2);switch(o){case"XYZ":this._x=p*h*u+l*d*_,this._y=l*d*u-p*h*_,this._z=l*h*_+p*d*u,this._w=l*h*u-p*d*_;break;case"YXZ":this._x=p*h*u+l*d*_,this._y=l*d*u-p*h*_,this._z=l*h*_-p*d*u,this._w=l*h*u+p*d*_;break;case"ZXY":this._x=p*h*u-l*d*_,this._y=l*d*u+p*h*_,this._z=l*h*_+p*d*u,this._w=l*h*u-p*d*_;break;case"ZYX":this._x=p*h*u-l*d*_,this._y=l*d*u+p*h*_,this._z=l*h*_-p*d*u,this._w=l*h*u+p*d*_;break;case"YZX":this._x=p*h*u+l*d*_,this._y=l*d*u+p*h*_,this._z=l*h*_-p*d*u,this._w=l*h*u-p*d*_;break;case"XZY":this._x=p*h*u-l*d*_,this._y=l*d*u-p*h*_,this._z=l*h*_+p*d*u,this._w=l*h*u+p*d*_;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const i=e/2,r=Math.sin(i);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,i=e[0],r=e[4],s=e[8],o=e[1],a=e[5],c=e[9],l=e[2],h=e[6],u=e[10],p=i+a+u;if(p>0){const d=.5/Math.sqrt(p+1);this._w=.25/d,this._x=(h-c)*d,this._y=(s-l)*d,this._z=(o-r)*d}else if(i>a&&i>u){const d=2*Math.sqrt(1+i-a-u);this._w=(h-c)/d,this._x=.25*d,this._y=(r+o)/d,this._z=(s+l)/d}else if(a>u){const d=2*Math.sqrt(1+a-i-u);this._w=(s-l)/d,this._x=(r+o)/d,this._y=.25*d,this._z=(c+h)/d}else{const d=2*Math.sqrt(1+u-i-a);this._w=(o-r)/d,this._x=(s+l)/d,this._y=(c+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(xe(this.dot(t),-1,1)))}rotateTowards(t,e){const i=this.angleTo(t);if(i===0)return this;const r=Math.min(1,e/i);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const i=t._x,r=t._y,s=t._z,o=t._w,a=e._x,c=e._y,l=e._z,h=e._w;return this._x=i*h+o*a+r*l-s*c,this._y=r*h+o*c+s*a-i*l,this._z=s*h+o*l+i*c-r*a,this._w=o*h-i*a-r*c-s*l,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const i=this._x,r=this._y,s=this._z,o=this._w;let a=o*t._w+i*t._x+r*t._y+s*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=i,this._y=r,this._z=s,this;const c=1-a*a;if(c<=Number.EPSILON){const d=1-e;return this._w=d*o+e*this._w,this._x=d*i+e*this._x,this._y=d*r+e*this._y,this._z=d*s+e*this._z,this.normalize(),this}const l=Math.sqrt(c),h=Math.atan2(l,a),u=Math.sin((1-e)*h)/l,p=Math.sin(e*h)/l;return this._w=o*u+this._w*p,this._x=i*u+this._x*p,this._y=r*u+this._y*p,this._z=s*u+this._z*p,this._onChangeCallback(),this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){const t=Math.random(),e=Math.sqrt(1-t),i=Math.sqrt(t),r=2*Math.PI*Math.random(),s=2*Math.PI*Math.random();return this.set(e*Math.cos(r),i*Math.sin(s),i*Math.cos(s),e*Math.sin(r))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class P{constructor(t=0,e=0,i=0){P.prototype.isVector3=!0,this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(aa.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(aa.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,i=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[3]*i+s[6]*r,this.y=s[1]*e+s[4]*i+s[7]*r,this.z=s[2]*e+s[5]*i+s[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,s=t.elements,o=1/(s[3]*e+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*e+s[4]*i+s[8]*r+s[12])*o,this.y=(s[1]*e+s[5]*i+s[9]*r+s[13])*o,this.z=(s[2]*e+s[6]*i+s[10]*r+s[14])*o,this}applyQuaternion(t){const e=this.x,i=this.y,r=this.z,s=t.x,o=t.y,a=t.z,c=t.w,l=2*(o*r-a*i),h=2*(a*e-s*r),u=2*(s*i-o*e);return this.x=e+c*l+o*u-a*h,this.y=i+c*h+a*l-s*u,this.z=r+c*u+s*h-o*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,i=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[4]*i+s[8]*r,this.y=s[1]*e+s[5]*i+s[9]*r,this.z=s[2]*e+s[6]*i+s[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const i=t.x,r=t.y,s=t.z,o=e.x,a=e.y,c=e.z;return this.x=r*c-s*a,this.y=s*o-i*c,this.z=i*a-r*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return us.copy(this).projectOnVector(t),this.sub(us)}reflect(t){return this.sub(us.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(xe(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y,r=this.z-t.z;return e*e+i*i+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){const r=Math.sin(e)*t;return this.x=r*Math.sin(i),this.y=Math.cos(e)*t,this.z=r*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=r,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=(Math.random()-.5)*2,e=Math.random()*Math.PI*2,i=Math.sqrt(1-t**2);return this.x=i*Math.cos(e),this.y=i*Math.sin(e),this.z=t,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const us=new P,aa=new $i;class Un{constructor(t=new P(1/0,1/0,1/0),e=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(Je.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(Je.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const i=Je.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const s=i.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,Je):Je.fromBufferAttribute(s,o),Je.applyMatrix4(t.matrixWorld),this.expandByPoint(Je);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),rr.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),rr.copy(i.boundingBox)),rr.applyMatrix4(t.matrixWorld),this.union(rr)}const r=t.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],e);return this}containsPoint(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)}intersectsSphere(t){return this.clampPoint(t.center,Je),Je.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ii),sr.subVectors(this.max,Ii),Qn.subVectors(t.a,Ii),ti.subVectors(t.b,Ii),ei.subVectors(t.c,Ii),Mn.subVectors(ti,Qn),Sn.subVectors(ei,ti),Fn.subVectors(Qn,ei);let e=[0,-Mn.z,Mn.y,0,-Sn.z,Sn.y,0,-Fn.z,Fn.y,Mn.z,0,-Mn.x,Sn.z,0,-Sn.x,Fn.z,0,-Fn.x,-Mn.y,Mn.x,0,-Sn.y,Sn.x,0,-Fn.y,Fn.x,0];return!fs(e,Qn,ti,ei,sr)||(e=[1,0,0,0,1,0,0,0,1],!fs(e,Qn,ti,ei,sr))?!1:(or.crossVectors(Mn,Sn),e=[or.x,or.y,or.z],fs(e,Qn,ti,ei,sr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Je).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Je).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(ln[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),ln[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),ln[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),ln[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),ln[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),ln[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),ln[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),ln[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(ln),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const ln=[new P,new P,new P,new P,new P,new P,new P,new P],Je=new P,rr=new Un,Qn=new P,ti=new P,ei=new P,Mn=new P,Sn=new P,Fn=new P,Ii=new P,sr=new P,or=new P,On=new P;function fs(n,t,e,i,r){for(let s=0,o=n.length-3;s<=o;s+=3){On.fromArray(n,s);const a=r.x*Math.abs(On.x)+r.y*Math.abs(On.y)+r.z*Math.abs(On.z),c=t.dot(On),l=e.dot(On),h=i.dot(On);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>a)return!1}return!0}const th=new Un,Ni=new P,ds=new P;class io{constructor(t=new P,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const i=this.center;e!==void 0?i.copy(e):th.setFromPoints(t).getCenter(i);let r=0;for(let s=0,o=t.length;s<o;s++)r=Math.max(r,i.distanceToSquared(t[s]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ni.subVectors(t,this.center);const e=Ni.lengthSq();if(e>this.radius*this.radius){const i=Math.sqrt(e),r=(i-this.radius)*.5;this.center.addScaledVector(Ni,r/i),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ds.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ni.copy(t.center).add(ds)),this.expandByPoint(Ni.copy(t.center).sub(ds))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const hn=new P,ps=new P,ar=new P,yn=new P,ms=new P,cr=new P,_s=new P;class mc{constructor(t=new P,e=new P(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,hn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=hn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(hn.copy(this.origin).addScaledVector(this.direction,e),hn.distanceToSquared(t))}distanceSqToSegment(t,e,i,r){ps.copy(t).add(e).multiplyScalar(.5),ar.copy(e).sub(t).normalize(),yn.copy(this.origin).sub(ps);const s=t.distanceTo(e)*.5,o=-this.direction.dot(ar),a=yn.dot(this.direction),c=-yn.dot(ar),l=yn.lengthSq(),h=Math.abs(1-o*o);let u,p,d,_;if(h>0)if(u=o*c-a,p=o*a-c,_=s*h,u>=0)if(p>=-_)if(p<=_){const g=1/h;u*=g,p*=g,d=u*(u+o*p+2*a)+p*(o*u+p+2*c)+l}else p=s,u=Math.max(0,-(o*p+a)),d=-u*u+p*(p+2*c)+l;else p=-s,u=Math.max(0,-(o*p+a)),d=-u*u+p*(p+2*c)+l;else p<=-_?(u=Math.max(0,-(-o*s+a)),p=u>0?-s:Math.min(Math.max(-s,-c),s),d=-u*u+p*(p+2*c)+l):p<=_?(u=0,p=Math.min(Math.max(-s,-c),s),d=p*(p+2*c)+l):(u=Math.max(0,-(o*s+a)),p=u>0?s:Math.min(Math.max(-s,-c),s),d=-u*u+p*(p+2*c)+l);else p=o>0?-s:s,u=Math.max(0,-(o*p+a)),d=-u*u+p*(p+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(ps).addScaledVector(ar,p),d}intersectSphere(t,e){hn.subVectors(t.center,this.origin);const i=hn.dot(this.direction),r=hn.dot(hn)-i*i,s=t.radius*t.radius;if(r>s)return null;const o=Math.sqrt(s-r),a=i-o,c=i+o;return c<0?null:a<0?this.at(c,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){const i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,r,s,o,a,c;const l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,p=this.origin;return l>=0?(i=(t.min.x-p.x)*l,r=(t.max.x-p.x)*l):(i=(t.max.x-p.x)*l,r=(t.min.x-p.x)*l),h>=0?(s=(t.min.y-p.y)*h,o=(t.max.y-p.y)*h):(s=(t.max.y-p.y)*h,o=(t.min.y-p.y)*h),i>o||s>r||((s>i||isNaN(i))&&(i=s),(o<r||isNaN(r))&&(r=o),u>=0?(a=(t.min.z-p.z)*u,c=(t.max.z-p.z)*u):(a=(t.max.z-p.z)*u,c=(t.min.z-p.z)*u),i>c||a>r)||((a>i||i!==i)&&(i=a),(c<r||r!==r)&&(r=c),r<0)?null:this.at(i>=0?i:r,e)}intersectsBox(t){return this.intersectBox(t,hn)!==null}intersectTriangle(t,e,i,r,s){ms.subVectors(e,t),cr.subVectors(i,t),_s.crossVectors(ms,cr);let o=this.direction.dot(_s),a;if(o>0){if(r)return null;a=1}else if(o<0)a=-1,o=-o;else return null;yn.subVectors(this.origin,t);const c=a*this.direction.dot(cr.crossVectors(yn,cr));if(c<0)return null;const l=a*this.direction.dot(ms.cross(yn));if(l<0||c+l>o)return null;const h=-a*yn.dot(_s);return h<0?null:this.at(h/o,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ue{constructor(t,e,i,r,s,o,a,c,l,h,u,p,d,_,g,m){ue.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,r,s,o,a,c,l,h,u,p,d,_,g,m)}set(t,e,i,r,s,o,a,c,l,h,u,p,d,_,g,m){const f=this.elements;return f[0]=t,f[4]=e,f[8]=i,f[12]=r,f[1]=s,f[5]=o,f[9]=a,f[13]=c,f[2]=l,f[6]=h,f[10]=u,f[14]=p,f[3]=d,f[7]=_,f[11]=g,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ue().fromArray(this.elements)}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){const e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,i=t.elements,r=1/ni.setFromMatrixColumn(t,0).length(),s=1/ni.setFromMatrixColumn(t,1).length(),o=1/ni.setFromMatrixColumn(t,2).length();return e[0]=i[0]*r,e[1]=i[1]*r,e[2]=i[2]*r,e[3]=0,e[4]=i[4]*s,e[5]=i[5]*s,e[6]=i[6]*s,e[7]=0,e[8]=i[8]*o,e[9]=i[9]*o,e[10]=i[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,i=t.x,r=t.y,s=t.z,o=Math.cos(i),a=Math.sin(i),c=Math.cos(r),l=Math.sin(r),h=Math.cos(s),u=Math.sin(s);if(t.order==="XYZ"){const p=o*h,d=o*u,_=a*h,g=a*u;e[0]=c*h,e[4]=-c*u,e[8]=l,e[1]=d+_*l,e[5]=p-g*l,e[9]=-a*c,e[2]=g-p*l,e[6]=_+d*l,e[10]=o*c}else if(t.order==="YXZ"){const p=c*h,d=c*u,_=l*h,g=l*u;e[0]=p+g*a,e[4]=_*a-d,e[8]=o*l,e[1]=o*u,e[5]=o*h,e[9]=-a,e[2]=d*a-_,e[6]=g+p*a,e[10]=o*c}else if(t.order==="ZXY"){const p=c*h,d=c*u,_=l*h,g=l*u;e[0]=p-g*a,e[4]=-o*u,e[8]=_+d*a,e[1]=d+_*a,e[5]=o*h,e[9]=g-p*a,e[2]=-o*l,e[6]=a,e[10]=o*c}else if(t.order==="ZYX"){const p=o*h,d=o*u,_=a*h,g=a*u;e[0]=c*h,e[4]=_*l-d,e[8]=p*l+g,e[1]=c*u,e[5]=g*l+p,e[9]=d*l-_,e[2]=-l,e[6]=a*c,e[10]=o*c}else if(t.order==="YZX"){const p=o*c,d=o*l,_=a*c,g=a*l;e[0]=c*h,e[4]=g-p*u,e[8]=_*u+d,e[1]=u,e[5]=o*h,e[9]=-a*h,e[2]=-l*h,e[6]=d*u+_,e[10]=p-g*u}else if(t.order==="XZY"){const p=o*c,d=o*l,_=a*c,g=a*l;e[0]=c*h,e[4]=-u,e[8]=l*h,e[1]=p*u+g,e[5]=o*h,e[9]=d*u-_,e[2]=_*u-d,e[6]=a*h,e[10]=g*u+p}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(eh,t,nh)}lookAt(t,e,i){const r=this.elements;return He.subVectors(t,e),He.lengthSq()===0&&(He.z=1),He.normalize(),En.crossVectors(i,He),En.lengthSq()===0&&(Math.abs(i.z)===1?He.x+=1e-4:He.z+=1e-4,He.normalize(),En.crossVectors(i,He)),En.normalize(),lr.crossVectors(He,En),r[0]=En.x,r[4]=lr.x,r[8]=He.x,r[1]=En.y,r[5]=lr.y,r[9]=He.y,r[2]=En.z,r[6]=lr.z,r[10]=He.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,s=this.elements,o=i[0],a=i[4],c=i[8],l=i[12],h=i[1],u=i[5],p=i[9],d=i[13],_=i[2],g=i[6],m=i[10],f=i[14],x=i[3],v=i[7],A=i[11],N=i[15],w=r[0],R=r[4],C=r[8],S=r[12],E=r[1],D=r[5],B=r[9],z=r[13],b=r[2],U=r[6],O=r[10],q=r[14],Z=r[3],k=r[7],J=r[11],$=r[15];return s[0]=o*w+a*E+c*b+l*Z,s[4]=o*R+a*D+c*U+l*k,s[8]=o*C+a*B+c*O+l*J,s[12]=o*S+a*z+c*q+l*$,s[1]=h*w+u*E+p*b+d*Z,s[5]=h*R+u*D+p*U+d*k,s[9]=h*C+u*B+p*O+d*J,s[13]=h*S+u*z+p*q+d*$,s[2]=_*w+g*E+m*b+f*Z,s[6]=_*R+g*D+m*U+f*k,s[10]=_*C+g*B+m*O+f*J,s[14]=_*S+g*z+m*q+f*$,s[3]=x*w+v*E+A*b+N*Z,s[7]=x*R+v*D+A*U+N*k,s[11]=x*C+v*B+A*O+N*J,s[15]=x*S+v*z+A*q+N*$,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[4],r=t[8],s=t[12],o=t[1],a=t[5],c=t[9],l=t[13],h=t[2],u=t[6],p=t[10],d=t[14],_=t[3],g=t[7],m=t[11],f=t[15];return _*(+s*c*u-r*l*u-s*a*p+i*l*p+r*a*d-i*c*d)+g*(+e*c*d-e*l*p+s*o*p-r*o*d+r*l*h-s*c*h)+m*(+e*l*u-e*a*d-s*o*u+i*o*d+s*a*h-i*l*h)+f*(-r*a*h-e*c*u+e*a*p+r*o*u-i*o*p+i*c*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){const r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=e,r[14]=i),this}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],s=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8],u=t[9],p=t[10],d=t[11],_=t[12],g=t[13],m=t[14],f=t[15],x=u*m*l-g*p*l+g*c*d-a*m*d-u*c*f+a*p*f,v=_*p*l-h*m*l-_*c*d+o*m*d+h*c*f-o*p*f,A=h*g*l-_*u*l+_*a*d-o*g*d-h*a*f+o*u*f,N=_*u*c-h*g*c-_*a*p+o*g*p+h*a*m-o*u*m,w=e*x+i*v+r*A+s*N;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const R=1/w;return t[0]=x*R,t[1]=(g*p*s-u*m*s-g*r*d+i*m*d+u*r*f-i*p*f)*R,t[2]=(a*m*s-g*c*s+g*r*l-i*m*l-a*r*f+i*c*f)*R,t[3]=(u*c*s-a*p*s-u*r*l+i*p*l+a*r*d-i*c*d)*R,t[4]=v*R,t[5]=(h*m*s-_*p*s+_*r*d-e*m*d-h*r*f+e*p*f)*R,t[6]=(_*c*s-o*m*s-_*r*l+e*m*l+o*r*f-e*c*f)*R,t[7]=(o*p*s-h*c*s+h*r*l-e*p*l-o*r*d+e*c*d)*R,t[8]=A*R,t[9]=(_*u*s-h*g*s-_*i*d+e*g*d+h*i*f-e*u*f)*R,t[10]=(o*g*s-_*a*s+_*i*l-e*g*l-o*i*f+e*a*f)*R,t[11]=(h*a*s-o*u*s-h*i*l+e*u*l+o*i*d-e*a*d)*R,t[12]=N*R,t[13]=(h*g*r-_*u*r+_*i*p-e*g*p-h*i*m+e*u*m)*R,t[14]=(_*a*r-o*g*r-_*i*c+e*g*c+o*i*m-e*a*m)*R,t[15]=(o*u*r-h*a*r+h*i*c-e*u*c-o*i*p+e*a*p)*R,this}scale(t){const e=this.elements,i=t.x,r=t.y,s=t.z;return e[0]*=i,e[4]*=r,e[8]*=s,e[1]*=i,e[5]*=r,e[9]*=s,e[2]*=i,e[6]*=r,e[10]*=s,e[3]*=i,e[7]*=r,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,r))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const i=Math.cos(e),r=Math.sin(e),s=1-i,o=t.x,a=t.y,c=t.z,l=s*o,h=s*a;return this.set(l*o+i,l*a-r*c,l*c+r*a,0,l*a+r*c,h*a+i,h*c-r*o,0,l*c-r*a,h*c+r*o,s*c*c+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,r,s,o){return this.set(1,i,s,0,t,1,o,0,e,r,1,0,0,0,0,1),this}compose(t,e,i){const r=this.elements,s=e._x,o=e._y,a=e._z,c=e._w,l=s+s,h=o+o,u=a+a,p=s*l,d=s*h,_=s*u,g=o*h,m=o*u,f=a*u,x=c*l,v=c*h,A=c*u,N=i.x,w=i.y,R=i.z;return r[0]=(1-(g+f))*N,r[1]=(d+A)*N,r[2]=(_-v)*N,r[3]=0,r[4]=(d-A)*w,r[5]=(1-(p+f))*w,r[6]=(m+x)*w,r[7]=0,r[8]=(_+v)*R,r[9]=(m-x)*R,r[10]=(1-(p+g))*R,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,e,i){const r=this.elements;let s=ni.set(r[0],r[1],r[2]).length();const o=ni.set(r[4],r[5],r[6]).length(),a=ni.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),t.x=r[12],t.y=r[13],t.z=r[14],Ke.copy(this);const l=1/s,h=1/o,u=1/a;return Ke.elements[0]*=l,Ke.elements[1]*=l,Ke.elements[2]*=l,Ke.elements[4]*=h,Ke.elements[5]*=h,Ke.elements[6]*=h,Ke.elements[8]*=u,Ke.elements[9]*=u,Ke.elements[10]*=u,e.setFromRotationMatrix(Ke),i.x=s,i.y=o,i.z=a,this}makePerspective(t,e,i,r,s,o,a=_n){const c=this.elements,l=2*s/(e-t),h=2*s/(i-r),u=(e+t)/(e-t),p=(i+r)/(i-r);let d,_;if(a===_n)d=-(o+s)/(o-s),_=-2*o*s/(o-s);else if(a===Ir)d=-o/(o-s),_=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=h,c[9]=p,c[13]=0,c[2]=0,c[6]=0,c[10]=d,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,i,r,s,o,a=_n){const c=this.elements,l=1/(e-t),h=1/(i-r),u=1/(o-s),p=(e+t)*l,d=(i+r)*h;let _,g;if(a===_n)_=(o+s)*u,g=-2*u;else if(a===Ir)_=s*u,g=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-p,c[1]=0,c[5]=2*h,c[9]=0,c[13]=-d,c[2]=0,c[6]=0,c[10]=g,c[14]=-_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<16;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}}const ni=new P,Ke=new ue,eh=new P(0,0,0),nh=new P(1,1,1),En=new P,lr=new P,He=new P,ca=new ue,la=new $i;class Vr{constructor(t=0,e=0,i=0,r=Vr.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,r=this._order){return this._x=t,this._y=e,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){const r=t.elements,s=r[0],o=r[4],a=r[8],c=r[1],l=r[5],h=r[9],u=r[2],p=r[6],d=r[10];switch(e){case"XYZ":this._y=Math.asin(xe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(p,l),this._z=0);break;case"YXZ":this._x=Math.asin(-xe(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(xe(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-xe(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(p,d),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(xe(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-xe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(p,l),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-h,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return ca.makeRotationFromQuaternion(t),this.setFromRotationMatrix(ca,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return la.setFromEuler(this),this.setFromQuaternion(la,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Vr.DEFAULT_ORDER="XYZ";class ro{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let ih=0;const ha=new P,ii=new $i,un=new ue,hr=new P,Fi=new P,rh=new P,sh=new $i,ua=new P(1,0,0),fa=new P(0,1,0),da=new P(0,0,1),oh={type:"added"},ah={type:"removed"};class ye extends bi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:ih++}),this.uuid=wi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=ye.DEFAULT_UP.clone();const t=new P,e=new Vr,i=new $i,r=new P(1,1,1);function s(){i.setFromEuler(e,!1)}function o(){e.setFromQuaternion(i,void 0,!1)}e._onChange(s),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new ue},normalMatrix:{value:new Wt}}),this.matrix=new ue,this.matrixWorld=new ue,this.matrixAutoUpdate=ye.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=ye.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ro,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ii.setFromAxisAngle(t,e),this.quaternion.multiply(ii),this}rotateOnWorldAxis(t,e){return ii.setFromAxisAngle(t,e),this.quaternion.premultiply(ii),this}rotateX(t){return this.rotateOnAxis(ua,t)}rotateY(t){return this.rotateOnAxis(fa,t)}rotateZ(t){return this.rotateOnAxis(da,t)}translateOnAxis(t,e){return ha.copy(t).applyQuaternion(this.quaternion),this.position.add(ha.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(ua,t)}translateY(t){return this.translateOnAxis(fa,t)}translateZ(t){return this.translateOnAxis(da,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(un.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?hr.copy(t):hr.set(t,e,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Fi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?un.lookAt(Fi,hr,this.up):un.lookAt(hr,Fi,this.up),this.quaternion.setFromRotationMatrix(un),r&&(un.extractRotation(r.matrixWorld),ii.setFromRotationMatrix(un),this.quaternion.premultiply(ii.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.parent!==null&&t.parent.remove(t),t.parent=this,this.children.push(t),t.dispatchEvent(oh)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(ah)),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),un.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),un.multiply(t.parent.matrixWorld)),t.applyMatrix4(un),this.add(t),t.updateWorldMatrix(!1,!0),this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fi,t,rh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fi,sh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let i=0,r=e.length;i<r;i++){const s=e[i];(s.matrixWorldAutoUpdate===!0||t===!0)&&s.updateMatrixWorld(t)}}updateWorldMatrix(t,e){const i=this.parent;if(t===!0&&i!==null&&i.matrixWorldAutoUpdate===!0&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),e===!0){const r=this.children;for(let s=0,o=r.length;s<o;s++){const a=r[s];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(t){const e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),r.maxGeometryCount=this._maxGeometryCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(t),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function s(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const c=a.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const u=c[l];s(t.shapes,u)}else s(t.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(s(t.materials,this.material[c]));r.material=a}else r.material=s(t.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){const c=this.animations[a];r.animations.push(s(t.animations,c))}}if(e){const a=o(t.geometries),c=o(t.materials),l=o(t.textures),h=o(t.images),u=o(t.shapes),p=o(t.skeletons),d=o(t.animations),_=o(t.nodes);a.length>0&&(i.geometries=a),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),p.length>0&&(i.skeletons=p),d.length>0&&(i.animations=d),_.length>0&&(i.nodes=_)}return i.object=r,i;function o(a){const c=[];for(const l in a){const h=a[l];delete h.metadata,c.push(h)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){const r=t.children[i];this.add(r.clone())}return this}}ye.DEFAULT_UP=new P(0,1,0);ye.DEFAULT_MATRIX_AUTO_UPDATE=!0;ye.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const je=new P,fn=new P,gs=new P,dn=new P,ri=new P,si=new P,pa=new P,vs=new P,xs=new P,Ms=new P;let ur=!1;class $e{constructor(t=new P,e=new P,i=new P){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,r){r.subVectors(i,e),je.subVectors(t,e),r.cross(je);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(t,e,i,r,s){je.subVectors(r,e),fn.subVectors(i,e),gs.subVectors(t,e);const o=je.dot(je),a=je.dot(fn),c=je.dot(gs),l=fn.dot(fn),h=fn.dot(gs),u=o*l-a*a;if(u===0)return s.set(0,0,0),null;const p=1/u,d=(l*c-a*h)*p,_=(o*h-a*c)*p;return s.set(1-d-_,_,d)}static containsPoint(t,e,i,r){return this.getBarycoord(t,e,i,r,dn)===null?!1:dn.x>=0&&dn.y>=0&&dn.x+dn.y<=1}static getUV(t,e,i,r,s,o,a,c){return ur===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),ur=!0),this.getInterpolation(t,e,i,r,s,o,a,c)}static getInterpolation(t,e,i,r,s,o,a,c){return this.getBarycoord(t,e,i,r,dn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,dn.x),c.addScaledVector(o,dn.y),c.addScaledVector(a,dn.z),c)}static isFrontFacing(t,e,i,r){return je.subVectors(i,e),fn.subVectors(t,e),je.cross(fn).dot(r)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,r){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,e,i,r){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return je.subVectors(this.c,this.b),fn.subVectors(this.a,this.b),je.cross(fn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return $e.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return $e.getBarycoord(t,this.a,this.b,this.c,e)}getUV(t,e,i,r,s){return ur===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),ur=!0),$e.getInterpolation(t,this.a,this.b,this.c,e,i,r,s)}getInterpolation(t,e,i,r,s){return $e.getInterpolation(t,this.a,this.b,this.c,e,i,r,s)}containsPoint(t){return $e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return $e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const i=this.a,r=this.b,s=this.c;let o,a;ri.subVectors(r,i),si.subVectors(s,i),vs.subVectors(t,i);const c=ri.dot(vs),l=si.dot(vs);if(c<=0&&l<=0)return e.copy(i);xs.subVectors(t,r);const h=ri.dot(xs),u=si.dot(xs);if(h>=0&&u<=h)return e.copy(r);const p=c*u-h*l;if(p<=0&&c>=0&&h<=0)return o=c/(c-h),e.copy(i).addScaledVector(ri,o);Ms.subVectors(t,s);const d=ri.dot(Ms),_=si.dot(Ms);if(_>=0&&d<=_)return e.copy(s);const g=d*l-c*_;if(g<=0&&l>=0&&_<=0)return a=l/(l-_),e.copy(i).addScaledVector(si,a);const m=h*_-d*u;if(m<=0&&u-h>=0&&d-_>=0)return pa.subVectors(s,r),a=(u-h)/(u-h+(d-_)),e.copy(r).addScaledVector(pa,a);const f=1/(m+g+p);return o=g*f,a=p*f,e.copy(i).addScaledVector(ri,o).addScaledVector(si,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const _c={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Tn={h:0,s:0,l:0},fr={h:0,s:0,l:0};function Ss(n,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?n+(t-n)*6*e:e<1/2?t:e<2/3?n+(t-n)*6*(2/3-e):n}class Yt{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){const r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=he){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,jt.toWorkingColorSpace(this,e),this}setRGB(t,e,i,r=jt.workingColorSpace){return this.r=t,this.g=e,this.b=i,jt.toWorkingColorSpace(this,r),this}setHSL(t,e,i,r=jt.workingColorSpace){if(t=Yl(t,1),e=xe(e,0,1),i=xe(i,0,1),e===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+e):i+e-i*e,o=2*i-s;this.r=Ss(o,s,t+1/3),this.g=Ss(o,s,t),this.b=Ss(o,s,t-1/3)}return jt.toWorkingColorSpace(this,r),this}setStyle(t,e=he){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(s,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=he){const i=_c[t.toLowerCase()];return i!==void 0?this.setHex(i,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=vi(t.r),this.g=vi(t.g),this.b=vi(t.b),this}copyLinearToSRGB(t){return this.r=ls(t.r),this.g=ls(t.g),this.b=ls(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=he){return jt.fromWorkingColorSpace(Ae.copy(this),t),Math.round(xe(Ae.r*255,0,255))*65536+Math.round(xe(Ae.g*255,0,255))*256+Math.round(xe(Ae.b*255,0,255))}getHexString(t=he){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=jt.workingColorSpace){jt.fromWorkingColorSpace(Ae.copy(this),e);const i=Ae.r,r=Ae.g,s=Ae.b,o=Math.max(i,r,s),a=Math.min(i,r,s);let c,l;const h=(a+o)/2;if(a===o)c=0,l=0;else{const u=o-a;switch(l=h<=.5?u/(o+a):u/(2-o-a),o){case i:c=(r-s)/u+(r<s?6:0);break;case r:c=(s-i)/u+2;break;case s:c=(i-r)/u+4;break}c/=6}return t.h=c,t.s=l,t.l=h,t}getRGB(t,e=jt.workingColorSpace){return jt.fromWorkingColorSpace(Ae.copy(this),e),t.r=Ae.r,t.g=Ae.g,t.b=Ae.b,t}getStyle(t=he){jt.fromWorkingColorSpace(Ae.copy(this),t);const e=Ae.r,i=Ae.g,r=Ae.b;return t!==he?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(t,e,i){return this.getHSL(Tn),this.setHSL(Tn.h+t,Tn.s+e,Tn.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(Tn),t.getHSL(fr);const i=as(Tn.h,fr.h,e),r=as(Tn.s,fr.s,e),s=as(Tn.l,fr.l,e);return this.setHSL(i,r,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,i=this.g,r=this.b,s=t.elements;return this.r=s[0]*e+s[3]*i+s[6]*r,this.g=s[1]*e+s[4]*i+s[7]*r,this.b=s[2]*e+s[5]*i+s[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ae=new Yt;Yt.NAMES=_c;let ch=0;class Qi extends bi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:ch++}),this.uuid=wi(),this.name="",this.type="Material",this.blending=gi,this.side=Ln,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Bs,this.blendDst=zs,this.blendEquation=Vn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Yt(0,0,0),this.blendAlpha=0,this.depthFunc=Cr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ta,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=jn,this.stencilZFail=jn,this.stencilZPass=jn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const i=t[e];if(i===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[e]=i}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==gi&&(i.blending=this.blending),this.side!==Ln&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Bs&&(i.blendSrc=this.blendSrc),this.blendDst!==zs&&(i.blendDst=this.blendDst),this.blendEquation!==Vn&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Cr&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==ta&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==jn&&(i.stencilFail=this.stencilFail),this.stencilZFail!==jn&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==jn&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const o=[];for(const a in s){const c=s[a];delete c.metadata,o.push(c)}return o}if(e){const s=r(t.textures),o=r(t.images);s.length>0&&(i.textures=s),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let i=null;if(e!==null){const r=e.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=e[s].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class Yn extends Qi{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Yt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Qa,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const fe=new P,dr=new st;class sn{constructor(t,e,i=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=ea,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=bn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[t+r]=e.array[i+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)dr.fromBufferAttribute(this,e),dr.applyMatrix3(t),this.setXY(e,dr.x,dr.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)fe.fromBufferAttribute(this,e),fe.applyMatrix3(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)fe.fromBufferAttribute(this,e),fe.applyMatrix4(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)fe.fromBufferAttribute(this,e),fe.applyNormalMatrix(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)fe.fromBufferAttribute(this,e),fe.transformDirection(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=Ui(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=Ue(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Ui(e,this.array)),e}setX(t,e){return this.normalized&&(e=Ue(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Ui(e,this.array)),e}setY(t,e){return this.normalized&&(e=Ue(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Ui(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Ue(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Ui(e,this.array)),e}setW(t,e){return this.normalized&&(e=Ue(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=Ue(e,this.array),i=Ue(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,r){return t*=this.itemSize,this.normalized&&(e=Ue(e,this.array),i=Ue(i,this.array),r=Ue(r,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this}setXYZW(t,e,i,r,s){return t*=this.itemSize,this.normalized&&(e=Ue(e,this.array),i=Ue(i,this.array),r=Ue(r,this.array),s=Ue(s,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==ea&&(t.usage=this.usage),t}}class gc extends sn{constructor(t,e,i){super(new Uint16Array(t),e,i)}}class vc extends sn{constructor(t,e,i){super(new Uint32Array(t),e,i)}}class Qt extends sn{constructor(t,e,i){super(new Float32Array(t),e,i)}}let lh=0;const We=new ue,ys=new ye,oi=new P,Ve=new Un,Oi=new Un,ge=new P;class Be extends bi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:lh++}),this.uuid=wi(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(uc(t)?vc:gc)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Wt().getNormalMatrix(t);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return We.makeRotationFromQuaternion(t),this.applyMatrix4(We),this}rotateX(t){return We.makeRotationX(t),this.applyMatrix4(We),this}rotateY(t){return We.makeRotationY(t),this.applyMatrix4(We),this}rotateZ(t){return We.makeRotationZ(t),this.applyMatrix4(We),this}translate(t,e,i){return We.makeTranslation(t,e,i),this.applyMatrix4(We),this}scale(t,e,i){return We.makeScale(t,e,i),this.applyMatrix4(We),this}lookAt(t){return ys.lookAt(t),ys.updateMatrix(),this.applyMatrix4(ys.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(oi).negate(),this.translate(oi.x,oi.y,oi.z),this}setFromPoints(t){const e=[];for(let i=0,r=t.length;i<r;i++){const s=t[i];e.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new Qt(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Un);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,r=e.length;i<r;i++){const s=e[i];Ve.setFromBufferAttribute(s),this.morphTargetsRelative?(ge.addVectors(this.boundingBox.min,Ve.min),this.boundingBox.expandByPoint(ge),ge.addVectors(this.boundingBox.max,Ve.max),this.boundingBox.expandByPoint(ge)):(this.boundingBox.expandByPoint(Ve.min),this.boundingBox.expandByPoint(Ve.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new io);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new P,1/0);return}if(t){const i=this.boundingSphere.center;if(Ve.setFromBufferAttribute(t),e)for(let s=0,o=e.length;s<o;s++){const a=e[s];Oi.setFromBufferAttribute(a),this.morphTargetsRelative?(ge.addVectors(Ve.min,Oi.min),Ve.expandByPoint(ge),ge.addVectors(Ve.max,Oi.max),Ve.expandByPoint(ge)):(Ve.expandByPoint(Oi.min),Ve.expandByPoint(Oi.max))}Ve.getCenter(i);let r=0;for(let s=0,o=t.count;s<o;s++)ge.fromBufferAttribute(t,s),r=Math.max(r,i.distanceToSquared(ge));if(e)for(let s=0,o=e.length;s<o;s++){const a=e[s],c=this.morphTargetsRelative;for(let l=0,h=a.count;l<h;l++)ge.fromBufferAttribute(a,l),c&&(oi.fromBufferAttribute(t,l),ge.add(oi)),r=Math.max(r,i.distanceToSquared(ge))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.array,r=e.position.array,s=e.normal.array,o=e.uv.array,a=r.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new sn(new Float32Array(4*a),4));const c=this.getAttribute("tangent").array,l=[],h=[];for(let E=0;E<a;E++)l[E]=new P,h[E]=new P;const u=new P,p=new P,d=new P,_=new st,g=new st,m=new st,f=new P,x=new P;function v(E,D,B){u.fromArray(r,E*3),p.fromArray(r,D*3),d.fromArray(r,B*3),_.fromArray(o,E*2),g.fromArray(o,D*2),m.fromArray(o,B*2),p.sub(u),d.sub(u),g.sub(_),m.sub(_);const z=1/(g.x*m.y-m.x*g.y);isFinite(z)&&(f.copy(p).multiplyScalar(m.y).addScaledVector(d,-g.y).multiplyScalar(z),x.copy(d).multiplyScalar(g.x).addScaledVector(p,-m.x).multiplyScalar(z),l[E].add(f),l[D].add(f),l[B].add(f),h[E].add(x),h[D].add(x),h[B].add(x))}let A=this.groups;A.length===0&&(A=[{start:0,count:i.length}]);for(let E=0,D=A.length;E<D;++E){const B=A[E],z=B.start,b=B.count;for(let U=z,O=z+b;U<O;U+=3)v(i[U+0],i[U+1],i[U+2])}const N=new P,w=new P,R=new P,C=new P;function S(E){R.fromArray(s,E*3),C.copy(R);const D=l[E];N.copy(D),N.sub(R.multiplyScalar(R.dot(D))).normalize(),w.crossVectors(C,D);const z=w.dot(h[E])<0?-1:1;c[E*4]=N.x,c[E*4+1]=N.y,c[E*4+2]=N.z,c[E*4+3]=z}for(let E=0,D=A.length;E<D;++E){const B=A[E],z=B.start,b=B.count;for(let U=z,O=z+b;U<O;U+=3)S(i[U+0]),S(i[U+1]),S(i[U+2])}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new sn(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let p=0,d=i.count;p<d;p++)i.setXYZ(p,0,0,0);const r=new P,s=new P,o=new P,a=new P,c=new P,l=new P,h=new P,u=new P;if(t)for(let p=0,d=t.count;p<d;p+=3){const _=t.getX(p+0),g=t.getX(p+1),m=t.getX(p+2);r.fromBufferAttribute(e,_),s.fromBufferAttribute(e,g),o.fromBufferAttribute(e,m),h.subVectors(o,s),u.subVectors(r,s),h.cross(u),a.fromBufferAttribute(i,_),c.fromBufferAttribute(i,g),l.fromBufferAttribute(i,m),a.add(h),c.add(h),l.add(h),i.setXYZ(_,a.x,a.y,a.z),i.setXYZ(g,c.x,c.y,c.z),i.setXYZ(m,l.x,l.y,l.z)}else for(let p=0,d=e.count;p<d;p+=3)r.fromBufferAttribute(e,p+0),s.fromBufferAttribute(e,p+1),o.fromBufferAttribute(e,p+2),h.subVectors(o,s),u.subVectors(r,s),h.cross(u),i.setXYZ(p+0,h.x,h.y,h.z),i.setXYZ(p+1,h.x,h.y,h.z),i.setXYZ(p+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)ge.fromBufferAttribute(t,e),ge.normalize(),t.setXYZ(e,ge.x,ge.y,ge.z)}toNonIndexed(){function t(a,c){const l=a.array,h=a.itemSize,u=a.normalized,p=new l.constructor(c.length*h);let d=0,_=0;for(let g=0,m=c.length;g<m;g++){a.isInterleavedBufferAttribute?d=c[g]*a.data.stride+a.offset:d=c[g]*h;for(let f=0;f<h;f++)p[_++]=l[d++]}return new sn(p,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Be,i=this.index.array,r=this.attributes;for(const a in r){const c=r[a],l=t(c,i);e.setAttribute(a,l)}const s=this.morphAttributes;for(const a in s){const c=[],l=s[a];for(let h=0,u=l.length;h<u;h++){const p=l[h],d=t(p,i);c.push(d)}e.morphAttributes[a]=c}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,c=o.length;a<c;a++){const l=o[a];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const i=this.attributes;for(const c in i){const l=i[c];t.data.attributes[c]=l.toJSON(t.data)}const r={};let s=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let u=0,p=l.length;u<p;u++){const d=l[u];h.push(d.toJSON(t.data))}h.length>0&&(r[c]=h,s=!0)}s&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone(e));const r=t.attributes;for(const l in r){const h=r[l];this.setAttribute(l,h.clone(e))}const s=t.morphAttributes;for(const l in s){const h=[],u=s[l];for(let p=0,d=u.length;p<d;p++)h.push(u[p].clone(e));this.morphAttributes[l]=h}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let l=0,h=o.length;l<h;l++){const u=o[l];this.addGroup(u.start,u.count,u.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const ma=new ue,Bn=new mc,pr=new io,_a=new P,ai=new P,ci=new P,li=new P,Es=new P,mr=new P,_r=new st,gr=new st,vr=new st,ga=new P,va=new P,xa=new P,xr=new P,Mr=new P;class en extends ye{constructor(t=new Be,e=new Yn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(t,e){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,o=i.morphTargetsRelative;e.fromBufferAttribute(r,t);const a=this.morphTargetInfluences;if(s&&a){mr.set(0,0,0);for(let c=0,l=s.length;c<l;c++){const h=a[c],u=s[c];h!==0&&(Es.fromBufferAttribute(u,t),o?mr.addScaledVector(Es,h):mr.addScaledVector(Es.sub(e),h))}e.add(mr)}return e}raycast(t,e){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),pr.copy(i.boundingSphere),pr.applyMatrix4(s),Bn.copy(t.ray).recast(t.near),!(pr.containsPoint(Bn.origin)===!1&&(Bn.intersectSphere(pr,_a)===null||Bn.origin.distanceToSquared(_a)>(t.far-t.near)**2))&&(ma.copy(s).invert(),Bn.copy(t.ray).applyMatrix4(ma),!(i.boundingBox!==null&&Bn.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,Bn)))}_computeIntersections(t,e,i){let r;const s=this.geometry,o=this.material,a=s.index,c=s.attributes.position,l=s.attributes.uv,h=s.attributes.uv1,u=s.attributes.normal,p=s.groups,d=s.drawRange;if(a!==null)if(Array.isArray(o))for(let _=0,g=p.length;_<g;_++){const m=p[_],f=o[m.materialIndex],x=Math.max(m.start,d.start),v=Math.min(a.count,Math.min(m.start+m.count,d.start+d.count));for(let A=x,N=v;A<N;A+=3){const w=a.getX(A),R=a.getX(A+1),C=a.getX(A+2);r=Sr(this,f,t,i,l,h,u,w,R,C),r&&(r.faceIndex=Math.floor(A/3),r.face.materialIndex=m.materialIndex,e.push(r))}}else{const _=Math.max(0,d.start),g=Math.min(a.count,d.start+d.count);for(let m=_,f=g;m<f;m+=3){const x=a.getX(m),v=a.getX(m+1),A=a.getX(m+2);r=Sr(this,o,t,i,l,h,u,x,v,A),r&&(r.faceIndex=Math.floor(m/3),e.push(r))}}else if(c!==void 0)if(Array.isArray(o))for(let _=0,g=p.length;_<g;_++){const m=p[_],f=o[m.materialIndex],x=Math.max(m.start,d.start),v=Math.min(c.count,Math.min(m.start+m.count,d.start+d.count));for(let A=x,N=v;A<N;A+=3){const w=A,R=A+1,C=A+2;r=Sr(this,f,t,i,l,h,u,w,R,C),r&&(r.faceIndex=Math.floor(A/3),r.face.materialIndex=m.materialIndex,e.push(r))}}else{const _=Math.max(0,d.start),g=Math.min(c.count,d.start+d.count);for(let m=_,f=g;m<f;m+=3){const x=m,v=m+1,A=m+2;r=Sr(this,o,t,i,l,h,u,x,v,A),r&&(r.faceIndex=Math.floor(m/3),e.push(r))}}}}function hh(n,t,e,i,r,s,o,a){let c;if(t.side===Le?c=i.intersectTriangle(o,s,r,!0,a):c=i.intersectTriangle(r,s,o,t.side===Ln,a),c===null)return null;Mr.copy(a),Mr.applyMatrix4(n.matrixWorld);const l=e.ray.origin.distanceTo(Mr);return l<e.near||l>e.far?null:{distance:l,point:Mr.clone(),object:n}}function Sr(n,t,e,i,r,s,o,a,c,l){n.getVertexPosition(a,ai),n.getVertexPosition(c,ci),n.getVertexPosition(l,li);const h=hh(n,t,e,i,ai,ci,li,xr);if(h){r&&(_r.fromBufferAttribute(r,a),gr.fromBufferAttribute(r,c),vr.fromBufferAttribute(r,l),h.uv=$e.getInterpolation(xr,ai,ci,li,_r,gr,vr,new st)),s&&(_r.fromBufferAttribute(s,a),gr.fromBufferAttribute(s,c),vr.fromBufferAttribute(s,l),h.uv1=$e.getInterpolation(xr,ai,ci,li,_r,gr,vr,new st),h.uv2=h.uv1),o&&(ga.fromBufferAttribute(o,a),va.fromBufferAttribute(o,c),xa.fromBufferAttribute(o,l),h.normal=$e.getInterpolation(xr,ai,ci,li,ga,va,xa,new P),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));const u={a,b:c,c:l,normal:new P,materialIndex:0};$e.getNormal(ai,ci,li,u.normal),h.face=u}return h}class Ri extends Be{constructor(t=1,e=1,i=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:r,heightSegments:s,depthSegments:o};const a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);const c=[],l=[],h=[],u=[];let p=0,d=0;_("z","y","x",-1,-1,i,e,t,o,s,0),_("z","y","x",1,-1,i,e,-t,o,s,1),_("x","z","y",1,1,t,i,e,r,o,2),_("x","z","y",1,-1,t,i,-e,r,o,3),_("x","y","z",1,-1,t,e,i,r,s,4),_("x","y","z",-1,-1,t,e,-i,r,s,5),this.setIndex(c),this.setAttribute("position",new Qt(l,3)),this.setAttribute("normal",new Qt(h,3)),this.setAttribute("uv",new Qt(u,2));function _(g,m,f,x,v,A,N,w,R,C,S){const E=A/R,D=N/C,B=A/2,z=N/2,b=w/2,U=R+1,O=C+1;let q=0,Z=0;const k=new P;for(let J=0;J<O;J++){const $=J*D-z;for(let lt=0;lt<U;lt++){const Y=lt*E-B;k[g]=Y*x,k[m]=$*v,k[f]=b,l.push(k.x,k.y,k.z),k[g]=0,k[m]=0,k[f]=w>0?1:-1,h.push(k.x,k.y,k.z),u.push(lt/R),u.push(1-J/C),q+=1}}for(let J=0;J<C;J++)for(let $=0;$<R;$++){const lt=p+$+U*J,Y=p+$+U*(J+1),tt=p+($+1)+U*(J+1),dt=p+($+1)+U*J;c.push(lt,Y,dt),c.push(Y,tt,dt),Z+=6}a.addGroup(d,Z,S),d+=Z,p+=q}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ri(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Ei(n){const t={};for(const e in n){t[e]={};for(const i in n[e]){const r=n[e][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=r.clone():Array.isArray(r)?t[e][i]=r.slice():t[e][i]=r}}return t}function Re(n){const t={};for(let e=0;e<n.length;e++){const i=Ei(n[e]);for(const r in i)t[r]=i[r]}return t}function uh(n){const t=[];for(let e=0;e<n.length;e++)t.push(n[e].clone());return t}function xc(n){return n.getRenderTarget()===null?n.outputColorSpace:jt.workingColorSpace}const fh={clone:Ei,merge:Re};var dh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ph=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Zn extends Qi{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=dh,this.fragmentShader=ph,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Ei(t.uniforms),this.uniformsGroups=uh(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const r in this.uniforms){const o=this.uniforms[r].value;o&&o.isTexture?e.uniforms[r]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[r]={type:"m4",value:o.toArray()}:e.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}}class Mc extends ye{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ue,this.projectionMatrix=new ue,this.projectionMatrixInverse=new ue,this.coordinateSystem=_n}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class Ie extends Mc{constructor(t=50,e=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Ws*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(os*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ws*2*Math.atan(Math.tan(os*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(t,e,i,r,s,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(os*.5*this.fov)/this.zoom,i=2*e,r=this.aspect*i,s=-.5*r;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;s+=o.offsetX*r/c,e-=o.offsetY*i/l,r*=o.width/c,i*=o.height/l}const a=this.filmOffset;a!==0&&(s+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,e,e-i,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const hi=-90,ui=1;class mh extends ye{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Ie(hi,ui,t,e);r.layers=this.layers,this.add(r);const s=new Ie(hi,ui,t,e);s.layers=this.layers,this.add(s);const o=new Ie(hi,ui,t,e);o.layers=this.layers,this.add(o);const a=new Ie(hi,ui,t,e);a.layers=this.layers,this.add(a);const c=new Ie(hi,ui,t,e);c.layers=this.layers,this.add(c);const l=new Ie(hi,ui,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[i,r,s,o,a,c]=e;for(const l of e)this.remove(l);if(t===_n)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===Ir)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,c,l,h]=this.children,u=t.getRenderTarget(),p=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),_=t.xr.enabled;t.xr.enabled=!1;const g=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,t.setRenderTarget(i,0,r),t.render(e,s),t.setRenderTarget(i,1,r),t.render(e,o),t.setRenderTarget(i,2,r),t.render(e,a),t.setRenderTarget(i,3,r),t.render(e,c),t.setRenderTarget(i,4,r),t.render(e,l),i.texture.generateMipmaps=g,t.setRenderTarget(i,5,r),t.render(e,h),t.setRenderTarget(u,p,d),t.xr.enabled=_,i.texture.needsPMREMUpdate=!0}}class Sc extends Fe{constructor(t,e,i,r,s,o,a,c,l,h){t=t!==void 0?t:[],e=e!==void 0?e:Mi,super(t,e,i,r,s,o,a,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class _h extends Dn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},r=[i,i,i,i,i,i];e.encoding!==void 0&&(Hi("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),e.colorSpace=e.encoding===qn?he:qe),this.texture=new Sc(r,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Xe}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Ri(5,5,5),s=new Zn({name:"CubemapFromEquirect",uniforms:Ei(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Le,blending:wn});s.uniforms.tEquirect.value=e;const o=new en(r,s),a=e.minFilter;return e.minFilter===Xi&&(e.minFilter=Xe),new mh(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,i,r){const s=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,i,r);t.setRenderTarget(s)}}const Ts=new P,gh=new P,vh=new Wt;class Gn{constructor(t=new P(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,r){return this.normal.set(t,e,i),this.constant=r,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){const r=Ts.subVectors(i,e).cross(gh.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const i=t.delta(Ts),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const s=-(t.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:e.copy(t.start).addScaledVector(i,s)}intersectsLine(t){const e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const i=e||vh.getNormalMatrix(t),r=this.coplanarPoint(Ts).applyMatrix4(t),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const zn=new io,yr=new P;class so{constructor(t=new Gn,e=new Gn,i=new Gn,r=new Gn,s=new Gn,o=new Gn){this.planes=[t,e,i,r,s,o]}set(t,e,i,r,s,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(i),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(t){const e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=_n){const i=this.planes,r=t.elements,s=r[0],o=r[1],a=r[2],c=r[3],l=r[4],h=r[5],u=r[6],p=r[7],d=r[8],_=r[9],g=r[10],m=r[11],f=r[12],x=r[13],v=r[14],A=r[15];if(i[0].setComponents(c-s,p-l,m-d,A-f).normalize(),i[1].setComponents(c+s,p+l,m+d,A+f).normalize(),i[2].setComponents(c+o,p+h,m+_,A+x).normalize(),i[3].setComponents(c-o,p-h,m-_,A-x).normalize(),i[4].setComponents(c-a,p-u,m-g,A-v).normalize(),e===_n)i[5].setComponents(c+a,p+u,m+g,A+v).normalize();else if(e===Ir)i[5].setComponents(a,u,g,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),zn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),zn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(zn)}intersectsSprite(t){return zn.center.set(0,0,0),zn.radius=.7071067811865476,zn.applyMatrix4(t.matrixWorld),this.intersectsSphere(zn)}intersectsSphere(t){const e=this.planes,i=t.center,r=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(t){const e=this.planes;for(let i=0;i<6;i++){const r=e[i];if(yr.x=r.normal.x>0?t.max.x:t.min.x,yr.y=r.normal.y>0?t.max.y:t.min.y,yr.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint(yr)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function yc(){let n=null,t=!1,e=null,i=null;function r(s,o){e(s,o),i=n.requestAnimationFrame(r)}return{start:function(){t!==!0&&e!==null&&(i=n.requestAnimationFrame(r),t=!0)},stop:function(){n.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){n=s}}}function xh(n,t){const e=t.isWebGL2,i=new WeakMap;function r(l,h){const u=l.array,p=l.usage,d=u.byteLength,_=n.createBuffer();n.bindBuffer(h,_),n.bufferData(h,u,p),l.onUploadCallback();let g;if(u instanceof Float32Array)g=n.FLOAT;else if(u instanceof Uint16Array)if(l.isFloat16BufferAttribute)if(e)g=n.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else g=n.UNSIGNED_SHORT;else if(u instanceof Int16Array)g=n.SHORT;else if(u instanceof Uint32Array)g=n.UNSIGNED_INT;else if(u instanceof Int32Array)g=n.INT;else if(u instanceof Int8Array)g=n.BYTE;else if(u instanceof Uint8Array)g=n.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)g=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:_,type:g,bytesPerElement:u.BYTES_PER_ELEMENT,version:l.version,size:d}}function s(l,h,u){const p=h.array,d=h._updateRange,_=h.updateRanges;if(n.bindBuffer(u,l),d.count===-1&&_.length===0&&n.bufferSubData(u,0,p),_.length!==0){for(let g=0,m=_.length;g<m;g++){const f=_[g];e?n.bufferSubData(u,f.start*p.BYTES_PER_ELEMENT,p,f.start,f.count):n.bufferSubData(u,f.start*p.BYTES_PER_ELEMENT,p.subarray(f.start,f.start+f.count))}h.clearUpdateRanges()}d.count!==-1&&(e?n.bufferSubData(u,d.offset*p.BYTES_PER_ELEMENT,p,d.offset,d.count):n.bufferSubData(u,d.offset*p.BYTES_PER_ELEMENT,p.subarray(d.offset,d.offset+d.count)),d.count=-1),h.onUploadCallback()}function o(l){return l.isInterleavedBufferAttribute&&(l=l.data),i.get(l)}function a(l){l.isInterleavedBufferAttribute&&(l=l.data);const h=i.get(l);h&&(n.deleteBuffer(h.buffer),i.delete(l))}function c(l,h){if(l.isGLBufferAttribute){const p=i.get(l);(!p||p.version<l.version)&&i.set(l,{buffer:l.buffer,type:l.type,bytesPerElement:l.elementSize,version:l.version});return}l.isInterleavedBufferAttribute&&(l=l.data);const u=i.get(l);if(u===void 0)i.set(l,r(l,h));else if(u.version<l.version){if(u.size!==l.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");s(u.buffer,l,h),u.version=l.version}}return{get:o,remove:a,update:c}}class Ye extends Be{constructor(t=1,e=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:r};const s=t/2,o=e/2,a=Math.floor(i),c=Math.floor(r),l=a+1,h=c+1,u=t/a,p=e/c,d=[],_=[],g=[],m=[];for(let f=0;f<h;f++){const x=f*p-o;for(let v=0;v<l;v++){const A=v*u-s;_.push(A,-x,0),g.push(0,0,1),m.push(v/a),m.push(1-f/c)}}for(let f=0;f<c;f++)for(let x=0;x<a;x++){const v=x+l*f,A=x+l*(f+1),N=x+1+l*(f+1),w=x+1+l*f;d.push(v,A,w),d.push(A,N,w)}this.setIndex(d),this.setAttribute("position",new Qt(_,3)),this.setAttribute("normal",new Qt(g,3)),this.setAttribute("uv",new Qt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ye(t.width,t.height,t.widthSegments,t.heightSegments)}}var Mh=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Sh=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,yh=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Eh=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Th=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,Ah=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,bh=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,wh=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Rh=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Ch=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,Ph=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Lh=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Dh=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Uh=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Ih=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Nh=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,Fh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Oh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Bh=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,zh=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Gh=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Hh=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,Vh=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,kh=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Wh=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Xh=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,qh=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Yh=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Zh=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Jh=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Kh="gl_FragColor = linearToOutputTexel( gl_FragColor );",jh=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,$h=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Qh=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,tu=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,eu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,nu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,iu=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ru=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,su=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ou=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,au=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,cu=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,lu=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,hu=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,uu=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,fu=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,du=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,pu=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,mu=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,_u=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,gu=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,vu=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,xu=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Mu=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Su=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,yu=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Eu=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Tu=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Au=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,bu=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,wu=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Ru=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Cu=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Pu=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Lu=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Du=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Uu=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Iu=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,Nu=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,Fu=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,Ou=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Bu=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,zu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Gu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Hu=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Vu=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,ku=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Wu=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Xu=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,qu=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Yu=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Zu=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Ju=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ku=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,ju=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,$u=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Qu=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,tf=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,ef=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,nf=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,rf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,sf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,of=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,af=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,cf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,lf=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,hf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,uf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,ff=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,df=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,pf=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,mf=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,_f=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,gf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,vf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,xf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Mf=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Sf=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,yf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ef=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Tf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Af=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,bf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,wf=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,Rf=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Cf=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Pf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Lf=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Df=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Uf=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,If=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Nf=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ff=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Of=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Bf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,zf=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Gf=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Hf=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Vf=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,kf=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Wf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Xf=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qf=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Yf=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zf=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Jf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Kf=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,jf=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,$f=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Qf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,zt={alphahash_fragment:Mh,alphahash_pars_fragment:Sh,alphamap_fragment:yh,alphamap_pars_fragment:Eh,alphatest_fragment:Th,alphatest_pars_fragment:Ah,aomap_fragment:bh,aomap_pars_fragment:wh,batching_pars_vertex:Rh,batching_vertex:Ch,begin_vertex:Ph,beginnormal_vertex:Lh,bsdfs:Dh,iridescence_fragment:Uh,bumpmap_pars_fragment:Ih,clipping_planes_fragment:Nh,clipping_planes_pars_fragment:Fh,clipping_planes_pars_vertex:Oh,clipping_planes_vertex:Bh,color_fragment:zh,color_pars_fragment:Gh,color_pars_vertex:Hh,color_vertex:Vh,common:kh,cube_uv_reflection_fragment:Wh,defaultnormal_vertex:Xh,displacementmap_pars_vertex:qh,displacementmap_vertex:Yh,emissivemap_fragment:Zh,emissivemap_pars_fragment:Jh,colorspace_fragment:Kh,colorspace_pars_fragment:jh,envmap_fragment:$h,envmap_common_pars_fragment:Qh,envmap_pars_fragment:tu,envmap_pars_vertex:eu,envmap_physical_pars_fragment:du,envmap_vertex:nu,fog_vertex:iu,fog_pars_vertex:ru,fog_fragment:su,fog_pars_fragment:ou,gradientmap_pars_fragment:au,lightmap_fragment:cu,lightmap_pars_fragment:lu,lights_lambert_fragment:hu,lights_lambert_pars_fragment:uu,lights_pars_begin:fu,lights_toon_fragment:pu,lights_toon_pars_fragment:mu,lights_phong_fragment:_u,lights_phong_pars_fragment:gu,lights_physical_fragment:vu,lights_physical_pars_fragment:xu,lights_fragment_begin:Mu,lights_fragment_maps:Su,lights_fragment_end:yu,logdepthbuf_fragment:Eu,logdepthbuf_pars_fragment:Tu,logdepthbuf_pars_vertex:Au,logdepthbuf_vertex:bu,map_fragment:wu,map_pars_fragment:Ru,map_particle_fragment:Cu,map_particle_pars_fragment:Pu,metalnessmap_fragment:Lu,metalnessmap_pars_fragment:Du,morphcolor_vertex:Uu,morphnormal_vertex:Iu,morphtarget_pars_vertex:Nu,morphtarget_vertex:Fu,normal_fragment_begin:Ou,normal_fragment_maps:Bu,normal_pars_fragment:zu,normal_pars_vertex:Gu,normal_vertex:Hu,normalmap_pars_fragment:Vu,clearcoat_normal_fragment_begin:ku,clearcoat_normal_fragment_maps:Wu,clearcoat_pars_fragment:Xu,iridescence_pars_fragment:qu,opaque_fragment:Yu,packing:Zu,premultiplied_alpha_fragment:Ju,project_vertex:Ku,dithering_fragment:ju,dithering_pars_fragment:$u,roughnessmap_fragment:Qu,roughnessmap_pars_fragment:tf,shadowmap_pars_fragment:ef,shadowmap_pars_vertex:nf,shadowmap_vertex:rf,shadowmask_pars_fragment:sf,skinbase_vertex:of,skinning_pars_vertex:af,skinning_vertex:cf,skinnormal_vertex:lf,specularmap_fragment:hf,specularmap_pars_fragment:uf,tonemapping_fragment:ff,tonemapping_pars_fragment:df,transmission_fragment:pf,transmission_pars_fragment:mf,uv_pars_fragment:_f,uv_pars_vertex:gf,uv_vertex:vf,worldpos_vertex:xf,background_vert:Mf,background_frag:Sf,backgroundCube_vert:yf,backgroundCube_frag:Ef,cube_vert:Tf,cube_frag:Af,depth_vert:bf,depth_frag:wf,distanceRGBA_vert:Rf,distanceRGBA_frag:Cf,equirect_vert:Pf,equirect_frag:Lf,linedashed_vert:Df,linedashed_frag:Uf,meshbasic_vert:If,meshbasic_frag:Nf,meshlambert_vert:Ff,meshlambert_frag:Of,meshmatcap_vert:Bf,meshmatcap_frag:zf,meshnormal_vert:Gf,meshnormal_frag:Hf,meshphong_vert:Vf,meshphong_frag:kf,meshphysical_vert:Wf,meshphysical_frag:Xf,meshtoon_vert:qf,meshtoon_frag:Yf,points_vert:Zf,points_frag:Jf,shadow_vert:Kf,shadow_frag:jf,sprite_vert:$f,sprite_frag:Qf},ct={common:{diffuse:{value:new Yt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Wt},alphaMap:{value:null},alphaMapTransform:{value:new Wt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Wt}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Wt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Wt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Wt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Wt},normalScale:{value:new st(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Wt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Wt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Wt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Wt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Yt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Yt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Wt},alphaTest:{value:0},uvTransform:{value:new Wt}},sprite:{diffuse:{value:new Yt(16777215)},opacity:{value:1},center:{value:new st(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Wt},alphaMap:{value:null},alphaMapTransform:{value:new Wt},alphaTest:{value:0}}},rn={basic:{uniforms:Re([ct.common,ct.specularmap,ct.envmap,ct.aomap,ct.lightmap,ct.fog]),vertexShader:zt.meshbasic_vert,fragmentShader:zt.meshbasic_frag},lambert:{uniforms:Re([ct.common,ct.specularmap,ct.envmap,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.fog,ct.lights,{emissive:{value:new Yt(0)}}]),vertexShader:zt.meshlambert_vert,fragmentShader:zt.meshlambert_frag},phong:{uniforms:Re([ct.common,ct.specularmap,ct.envmap,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.fog,ct.lights,{emissive:{value:new Yt(0)},specular:{value:new Yt(1118481)},shininess:{value:30}}]),vertexShader:zt.meshphong_vert,fragmentShader:zt.meshphong_frag},standard:{uniforms:Re([ct.common,ct.envmap,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.roughnessmap,ct.metalnessmap,ct.fog,ct.lights,{emissive:{value:new Yt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:zt.meshphysical_vert,fragmentShader:zt.meshphysical_frag},toon:{uniforms:Re([ct.common,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.gradientmap,ct.fog,ct.lights,{emissive:{value:new Yt(0)}}]),vertexShader:zt.meshtoon_vert,fragmentShader:zt.meshtoon_frag},matcap:{uniforms:Re([ct.common,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.fog,{matcap:{value:null}}]),vertexShader:zt.meshmatcap_vert,fragmentShader:zt.meshmatcap_frag},points:{uniforms:Re([ct.points,ct.fog]),vertexShader:zt.points_vert,fragmentShader:zt.points_frag},dashed:{uniforms:Re([ct.common,ct.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:zt.linedashed_vert,fragmentShader:zt.linedashed_frag},depth:{uniforms:Re([ct.common,ct.displacementmap]),vertexShader:zt.depth_vert,fragmentShader:zt.depth_frag},normal:{uniforms:Re([ct.common,ct.bumpmap,ct.normalmap,ct.displacementmap,{opacity:{value:1}}]),vertexShader:zt.meshnormal_vert,fragmentShader:zt.meshnormal_frag},sprite:{uniforms:Re([ct.sprite,ct.fog]),vertexShader:zt.sprite_vert,fragmentShader:zt.sprite_frag},background:{uniforms:{uvTransform:{value:new Wt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:zt.background_vert,fragmentShader:zt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:zt.backgroundCube_vert,fragmentShader:zt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:zt.cube_vert,fragmentShader:zt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:zt.equirect_vert,fragmentShader:zt.equirect_frag},distanceRGBA:{uniforms:Re([ct.common,ct.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:zt.distanceRGBA_vert,fragmentShader:zt.distanceRGBA_frag},shadow:{uniforms:Re([ct.lights,ct.fog,{color:{value:new Yt(0)},opacity:{value:1}}]),vertexShader:zt.shadow_vert,fragmentShader:zt.shadow_frag}};rn.physical={uniforms:Re([rn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Wt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Wt},clearcoatNormalScale:{value:new st(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Wt},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Wt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Wt},sheen:{value:0},sheenColor:{value:new Yt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Wt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Wt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Wt},transmissionSamplerSize:{value:new st},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Wt},attenuationDistance:{value:0},attenuationColor:{value:new Yt(0)},specularColor:{value:new Yt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Wt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Wt},anisotropyVector:{value:new st},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Wt}}]),vertexShader:zt.meshphysical_vert,fragmentShader:zt.meshphysical_frag};const Er={r:0,b:0,g:0};function td(n,t,e,i,r,s,o){const a=new Yt(0);let c=s===!0?0:1,l,h,u=null,p=0,d=null;function _(m,f){let x=!1,v=f.isScene===!0?f.background:null;v&&v.isTexture&&(v=(f.backgroundBlurriness>0?e:t).get(v)),v===null?g(a,c):v&&v.isColor&&(g(v,1),x=!0);const A=n.xr.getEnvironmentBlendMode();A==="additive"?i.buffers.color.setClear(0,0,0,1,o):A==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||x)&&n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil),v&&(v.isCubeTexture||v.mapping===Gr)?(h===void 0&&(h=new en(new Ri(1,1,1),new Zn({name:"BackgroundCubeMaterial",uniforms:Ei(rn.backgroundCube.uniforms),vertexShader:rn.backgroundCube.vertexShader,fragmentShader:rn.backgroundCube.fragmentShader,side:Le,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(N,w,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(h)),h.material.uniforms.envMap.value=v,h.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=f.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,h.material.toneMapped=jt.getTransfer(v.colorSpace)!==ie,(u!==v||p!==v.version||d!==n.toneMapping)&&(h.material.needsUpdate=!0,u=v,p=v.version,d=n.toneMapping),h.layers.enableAll(),m.unshift(h,h.geometry,h.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new en(new Ye(2,2),new Zn({name:"BackgroundMaterial",uniforms:Ei(rn.background.uniforms),vertexShader:rn.background.vertexShader,fragmentShader:rn.background.fragmentShader,side:Ln,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,l.material.toneMapped=jt.getTransfer(v.colorSpace)!==ie,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(u!==v||p!==v.version||d!==n.toneMapping)&&(l.material.needsUpdate=!0,u=v,p=v.version,d=n.toneMapping),l.layers.enableAll(),m.unshift(l,l.geometry,l.material,0,0,null))}function g(m,f){m.getRGB(Er,xc(n)),i.buffers.color.setClear(Er.r,Er.g,Er.b,f,o)}return{getClearColor:function(){return a},setClearColor:function(m,f=1){a.set(m),c=f,g(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(m){c=m,g(a,c)},render:_}}function ed(n,t,e,i){const r=n.getParameter(n.MAX_VERTEX_ATTRIBS),s=i.isWebGL2?null:t.get("OES_vertex_array_object"),o=i.isWebGL2||s!==null,a={},c=m(null);let l=c,h=!1;function u(b,U,O,q,Z){let k=!1;if(o){const J=g(q,O,U);l!==J&&(l=J,d(l.object)),k=f(b,q,O,Z),k&&x(b,q,O,Z)}else{const J=U.wireframe===!0;(l.geometry!==q.id||l.program!==O.id||l.wireframe!==J)&&(l.geometry=q.id,l.program=O.id,l.wireframe=J,k=!0)}Z!==null&&e.update(Z,n.ELEMENT_ARRAY_BUFFER),(k||h)&&(h=!1,C(b,U,O,q),Z!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(Z).buffer))}function p(){return i.isWebGL2?n.createVertexArray():s.createVertexArrayOES()}function d(b){return i.isWebGL2?n.bindVertexArray(b):s.bindVertexArrayOES(b)}function _(b){return i.isWebGL2?n.deleteVertexArray(b):s.deleteVertexArrayOES(b)}function g(b,U,O){const q=O.wireframe===!0;let Z=a[b.id];Z===void 0&&(Z={},a[b.id]=Z);let k=Z[U.id];k===void 0&&(k={},Z[U.id]=k);let J=k[q];return J===void 0&&(J=m(p()),k[q]=J),J}function m(b){const U=[],O=[],q=[];for(let Z=0;Z<r;Z++)U[Z]=0,O[Z]=0,q[Z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:O,attributeDivisors:q,object:b,attributes:{},index:null}}function f(b,U,O,q){const Z=l.attributes,k=U.attributes;let J=0;const $=O.getAttributes();for(const lt in $)if($[lt].location>=0){const tt=Z[lt];let dt=k[lt];if(dt===void 0&&(lt==="instanceMatrix"&&b.instanceMatrix&&(dt=b.instanceMatrix),lt==="instanceColor"&&b.instanceColor&&(dt=b.instanceColor)),tt===void 0||tt.attribute!==dt||dt&&tt.data!==dt.data)return!0;J++}return l.attributesNum!==J||l.index!==q}function x(b,U,O,q){const Z={},k=U.attributes;let J=0;const $=O.getAttributes();for(const lt in $)if($[lt].location>=0){let tt=k[lt];tt===void 0&&(lt==="instanceMatrix"&&b.instanceMatrix&&(tt=b.instanceMatrix),lt==="instanceColor"&&b.instanceColor&&(tt=b.instanceColor));const dt={};dt.attribute=tt,tt&&tt.data&&(dt.data=tt.data),Z[lt]=dt,J++}l.attributes=Z,l.attributesNum=J,l.index=q}function v(){const b=l.newAttributes;for(let U=0,O=b.length;U<O;U++)b[U]=0}function A(b){N(b,0)}function N(b,U){const O=l.newAttributes,q=l.enabledAttributes,Z=l.attributeDivisors;O[b]=1,q[b]===0&&(n.enableVertexAttribArray(b),q[b]=1),Z[b]!==U&&((i.isWebGL2?n:t.get("ANGLE_instanced_arrays"))[i.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](b,U),Z[b]=U)}function w(){const b=l.newAttributes,U=l.enabledAttributes;for(let O=0,q=U.length;O<q;O++)U[O]!==b[O]&&(n.disableVertexAttribArray(O),U[O]=0)}function R(b,U,O,q,Z,k,J){J===!0?n.vertexAttribIPointer(b,U,O,Z,k):n.vertexAttribPointer(b,U,O,q,Z,k)}function C(b,U,O,q){if(i.isWebGL2===!1&&(b.isInstancedMesh||q.isInstancedBufferGeometry)&&t.get("ANGLE_instanced_arrays")===null)return;v();const Z=q.attributes,k=O.getAttributes(),J=U.defaultAttributeValues;for(const $ in k){const lt=k[$];if(lt.location>=0){let Y=Z[$];if(Y===void 0&&($==="instanceMatrix"&&b.instanceMatrix&&(Y=b.instanceMatrix),$==="instanceColor"&&b.instanceColor&&(Y=b.instanceColor)),Y!==void 0){const tt=Y.normalized,dt=Y.itemSize,St=e.get(Y);if(St===void 0)continue;const _t=St.buffer,Ct=St.type,It=St.bytesPerElement,yt=i.isWebGL2===!0&&(Ct===n.INT||Ct===n.UNSIGNED_INT||Y.gpuType===ec);if(Y.isInterleavedBufferAttribute){const Dt=Y.data,L=Dt.stride,ot=Y.offset;if(Dt.isInstancedInterleavedBuffer){for(let j=0;j<lt.locationSize;j++)N(lt.location+j,Dt.meshPerAttribute);b.isInstancedMesh!==!0&&q._maxInstanceCount===void 0&&(q._maxInstanceCount=Dt.meshPerAttribute*Dt.count)}else for(let j=0;j<lt.locationSize;j++)A(lt.location+j);n.bindBuffer(n.ARRAY_BUFFER,_t);for(let j=0;j<lt.locationSize;j++)R(lt.location+j,dt/lt.locationSize,Ct,tt,L*It,(ot+dt/lt.locationSize*j)*It,yt)}else{if(Y.isInstancedBufferAttribute){for(let Dt=0;Dt<lt.locationSize;Dt++)N(lt.location+Dt,Y.meshPerAttribute);b.isInstancedMesh!==!0&&q._maxInstanceCount===void 0&&(q._maxInstanceCount=Y.meshPerAttribute*Y.count)}else for(let Dt=0;Dt<lt.locationSize;Dt++)A(lt.location+Dt);n.bindBuffer(n.ARRAY_BUFFER,_t);for(let Dt=0;Dt<lt.locationSize;Dt++)R(lt.location+Dt,dt/lt.locationSize,Ct,tt,dt*It,dt/lt.locationSize*Dt*It,yt)}}else if(J!==void 0){const tt=J[$];if(tt!==void 0)switch(tt.length){case 2:n.vertexAttrib2fv(lt.location,tt);break;case 3:n.vertexAttrib3fv(lt.location,tt);break;case 4:n.vertexAttrib4fv(lt.location,tt);break;default:n.vertexAttrib1fv(lt.location,tt)}}}}w()}function S(){B();for(const b in a){const U=a[b];for(const O in U){const q=U[O];for(const Z in q)_(q[Z].object),delete q[Z];delete U[O]}delete a[b]}}function E(b){if(a[b.id]===void 0)return;const U=a[b.id];for(const O in U){const q=U[O];for(const Z in q)_(q[Z].object),delete q[Z];delete U[O]}delete a[b.id]}function D(b){for(const U in a){const O=a[U];if(O[b.id]===void 0)continue;const q=O[b.id];for(const Z in q)_(q[Z].object),delete q[Z];delete O[b.id]}}function B(){z(),h=!0,l!==c&&(l=c,d(l.object))}function z(){c.geometry=null,c.program=null,c.wireframe=!1}return{setup:u,reset:B,resetDefaultState:z,dispose:S,releaseStatesOfGeometry:E,releaseStatesOfProgram:D,initAttributes:v,enableAttribute:A,disableUnusedAttributes:w}}function nd(n,t,e,i){const r=i.isWebGL2;let s;function o(h){s=h}function a(h,u){n.drawArrays(s,h,u),e.update(u,s,1)}function c(h,u,p){if(p===0)return;let d,_;if(r)d=n,_="drawArraysInstanced";else if(d=t.get("ANGLE_instanced_arrays"),_="drawArraysInstancedANGLE",d===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}d[_](s,h,u,p),e.update(u,s,p)}function l(h,u,p){if(p===0)return;const d=t.get("WEBGL_multi_draw");if(d===null)for(let _=0;_<p;_++)this.render(h[_],u[_]);else{d.multiDrawArraysWEBGL(s,h,0,u,0,p);let _=0;for(let g=0;g<p;g++)_+=u[g];e.update(_,s,1)}}this.setMode=o,this.render=a,this.renderInstances=c,this.renderMultiDraw=l}function id(n,t,e){let i;function r(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const R=t.get("EXT_texture_filter_anisotropic");i=n.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function s(R){if(R==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&n.constructor.name==="WebGL2RenderingContext";let a=e.precision!==void 0?e.precision:"highp";const c=s(a);c!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",c,"instead."),a=c);const l=o||t.has("WEBGL_draw_buffers"),h=e.logarithmicDepthBuffer===!0,u=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),p=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),d=n.getParameter(n.MAX_TEXTURE_SIZE),_=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),g=n.getParameter(n.MAX_VERTEX_ATTRIBS),m=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),f=n.getParameter(n.MAX_VARYING_VECTORS),x=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),v=p>0,A=o||t.has("OES_texture_float"),N=v&&A,w=o?n.getParameter(n.MAX_SAMPLES):0;return{isWebGL2:o,drawBuffers:l,getMaxAnisotropy:r,getMaxPrecision:s,precision:a,logarithmicDepthBuffer:h,maxTextures:u,maxVertexTextures:p,maxTextureSize:d,maxCubemapSize:_,maxAttributes:g,maxVertexUniforms:m,maxVaryings:f,maxFragmentUniforms:x,vertexTextures:v,floatFragmentTextures:A,floatVertexTextures:N,maxSamples:w}}function rd(n){const t=this;let e=null,i=0,r=!1,s=!1;const o=new Gn,a=new Wt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,p){const d=u.length!==0||p||i!==0||r;return r=p,i=u.length,d},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,p){e=h(u,p,0)},this.setState=function(u,p,d){const _=u.clippingPlanes,g=u.clipIntersection,m=u.clipShadows,f=n.get(u);if(!r||_===null||_.length===0||s&&!m)s?h(null):l();else{const x=s?0:i,v=x*4;let A=f.clippingState||null;c.value=A,A=h(_,p,v,d);for(let N=0;N!==v;++N)A[N]=e[N];f.clippingState=A,this.numIntersection=g?this.numPlanes:0,this.numPlanes+=x}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function h(u,p,d,_){const g=u!==null?u.length:0;let m=null;if(g!==0){if(m=c.value,_!==!0||m===null){const f=d+g*4,x=p.matrixWorldInverse;a.getNormalMatrix(x),(m===null||m.length<f)&&(m=new Float32Array(f));for(let v=0,A=d;v!==g;++v,A+=4)o.copy(u[v]).applyMatrix4(x,a),o.normal.toArray(m,A),m[A+3]=o.constant}c.value=m,c.needsUpdate=!0}return t.numPlanes=g,t.numIntersection=0,m}}function sd(n){let t=new WeakMap;function e(o,a){return a===Gs?o.mapping=Mi:a===Hs&&(o.mapping=Si),o}function i(o){if(o&&o.isTexture){const a=o.mapping;if(a===Gs||a===Hs)if(t.has(o)){const c=t.get(o).texture;return e(c,o.mapping)}else{const c=o.image;if(c&&c.height>0){const l=new _h(c.height/2);return l.fromEquirectangularTexture(n,o),t.set(o,l),o.addEventListener("dispose",r),e(l.texture,o.mapping)}else return null}}return o}function r(o){const a=o.target;a.removeEventListener("dispose",r);const c=t.get(a);c!==void 0&&(t.delete(a),c.dispose())}function s(){t=new WeakMap}return{get:i,dispose:s}}class kr extends Mc{constructor(t=-1,e=1,i=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-t,o=i+t,a=r+e,c=r-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,o=s+l*this.view.width,a-=h*this.view.offsetY,c=a-h*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const di=4,Ma=[.125,.215,.35,.446,.526,.582],kn=20,As=new kr,Sa=new Yt;let bs=null,ws=0,Rs=0;const Hn=(1+Math.sqrt(5))/2,fi=1/Hn,ya=[new P(1,1,1),new P(-1,1,1),new P(1,1,-1),new P(-1,1,-1),new P(0,Hn,fi),new P(0,Hn,-fi),new P(fi,0,Hn),new P(-fi,0,Hn),new P(Hn,fi,0),new P(-Hn,fi,0)];class Yi{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,i=.1,r=100){bs=this._renderer.getRenderTarget(),ws=this._renderer.getActiveCubeFace(),Rs=this._renderer.getActiveMipmapLevel(),this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(t,i,r,s),e>0&&this._blur(s,0,0,e),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Aa(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ta(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(bs,ws,Rs),t.scissorTest=!1,Tr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Mi||t.mapping===Si?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),bs=this._renderer.getRenderTarget(),ws=this._renderer.getActiveCubeFace(),Rs=this._renderer.getActiveMipmapLevel();const i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:Xe,minFilter:Xe,generateMipmaps:!1,type:qi,format:tn,colorSpace:on,depthBuffer:!1},r=Ea(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ea(t,e,i);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=od(s)),this._blurMaterial=ad(s,t,e)}return r}_compileMaterial(t){const e=new en(this._lodPlanes[0],t);this._renderer.compile(e,As)}_sceneToCubeUV(t,e,i,r){const a=new Ie(90,1,e,i),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,p=h.toneMapping;h.getClearColor(Sa),h.toneMapping=gn,h.autoClear=!1;const d=new Yn({name:"PMREM.Background",side:Le,depthWrite:!1,depthTest:!1}),_=new en(new Ri,d);let g=!1;const m=t.background;m?m.isColor&&(d.color.copy(m),t.background=null,g=!0):(d.color.copy(Sa),g=!0);for(let f=0;f<6;f++){const x=f%3;x===0?(a.up.set(0,c[f],0),a.lookAt(l[f],0,0)):x===1?(a.up.set(0,0,c[f]),a.lookAt(0,l[f],0)):(a.up.set(0,c[f],0),a.lookAt(0,0,l[f]));const v=this._cubeSize;Tr(r,x*v,f>2?v:0,v,v),h.setRenderTarget(r),g&&h.render(_,a),h.render(t,a)}_.geometry.dispose(),_.material.dispose(),h.toneMapping=p,h.autoClear=u,t.background=m}_textureToCubeUV(t,e){const i=this._renderer,r=t.mapping===Mi||t.mapping===Si;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Aa()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ta());const s=r?this._cubemapMaterial:this._equirectMaterial,o=new en(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=t;const c=this._cubeSize;Tr(e,0,0,3*c,2*c),i.setRenderTarget(e),i.render(o,As)}_applyPMREM(t){const e=this._renderer,i=e.autoClear;e.autoClear=!1;for(let r=1;r<this._lodPlanes.length;r++){const s=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=ya[(r-1)%ya.length];this._blur(t,r-1,r,s,o)}e.autoClear=i}_blur(t,e,i,r,s){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,i,r,"latitudinal",s),this._halfBlur(o,t,i,i,r,"longitudinal",s)}_halfBlur(t,e,i,r,s,o,a){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,u=new en(this._lodPlanes[r],l),p=l.uniforms,d=this._sizeLods[i]-1,_=isFinite(s)?Math.PI/(2*d):2*Math.PI/(2*kn-1),g=s/_,m=isFinite(s)?1+Math.floor(h*g):kn;m>kn&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${kn}`);const f=[];let x=0;for(let R=0;R<kn;++R){const C=R/g,S=Math.exp(-C*C/2);f.push(S),R===0?x+=S:R<m&&(x+=2*S)}for(let R=0;R<f.length;R++)f[R]=f[R]/x;p.envMap.value=t.texture,p.samples.value=m,p.weights.value=f,p.latitudinal.value=o==="latitudinal",a&&(p.poleAxis.value=a);const{_lodMax:v}=this;p.dTheta.value=_,p.mipInt.value=v-i;const A=this._sizeLods[r],N=3*A*(r>v-di?r-v+di:0),w=4*(this._cubeSize-A);Tr(e,N,w,3*A,2*A),c.setRenderTarget(e),c.render(u,As)}}function od(n){const t=[],e=[],i=[];let r=n;const s=n-di+1+Ma.length;for(let o=0;o<s;o++){const a=Math.pow(2,r);e.push(a);let c=1/a;o>n-di?c=Ma[o-n+di-1]:o===0&&(c=0),i.push(c);const l=1/(a-2),h=-l,u=1+l,p=[h,h,u,h,u,u,h,h,u,u,h,u],d=6,_=6,g=3,m=2,f=1,x=new Float32Array(g*_*d),v=new Float32Array(m*_*d),A=new Float32Array(f*_*d);for(let w=0;w<d;w++){const R=w%3*2/3-1,C=w>2?0:-1,S=[R,C,0,R+2/3,C,0,R+2/3,C+1,0,R,C,0,R+2/3,C+1,0,R,C+1,0];x.set(S,g*_*w),v.set(p,m*_*w);const E=[w,w,w,w,w,w];A.set(E,f*_*w)}const N=new Be;N.setAttribute("position",new sn(x,g)),N.setAttribute("uv",new sn(v,m)),N.setAttribute("faceIndex",new sn(A,f)),t.push(N),r>di&&r--}return{lodPlanes:t,sizeLods:e,sigmas:i}}function Ea(n,t,e){const i=new Dn(n,t,e);return i.texture.mapping=Gr,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Tr(n,t,e,i,r){n.viewport.set(t,e,i,r),n.scissor.set(t,e,i,r)}function ad(n,t,e){const i=new Float32Array(kn),r=new P(0,1,0);return new Zn({name:"SphericalGaussianBlur",defines:{n:kn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:oo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:wn,depthTest:!1,depthWrite:!1})}function Ta(){return new Zn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:oo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:wn,depthTest:!1,depthWrite:!1})}function Aa(){return new Zn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:oo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:wn,depthTest:!1,depthWrite:!1})}function oo(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function cd(n){let t=new WeakMap,e=null;function i(a){if(a&&a.isTexture){const c=a.mapping,l=c===Gs||c===Hs,h=c===Mi||c===Si;if(l||h)if(a.isRenderTargetTexture&&a.needsPMREMUpdate===!0){a.needsPMREMUpdate=!1;let u=t.get(a);return e===null&&(e=new Yi(n)),u=l?e.fromEquirectangular(a,u):e.fromCubemap(a,u),t.set(a,u),u.texture}else{if(t.has(a))return t.get(a).texture;{const u=a.image;if(l&&u&&u.height>0||h&&u&&r(u)){e===null&&(e=new Yi(n));const p=l?e.fromEquirectangular(a):e.fromCubemap(a);return t.set(a,p),a.addEventListener("dispose",s),p.texture}else return null}}}return a}function r(a){let c=0;const l=6;for(let h=0;h<l;h++)a[h]!==void 0&&c++;return c===l}function s(a){const c=a.target;c.removeEventListener("dispose",s);const l=t.get(c);l!==void 0&&(t.delete(c),l.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:i,dispose:o}}function ld(n){const t={};function e(i){if(t[i]!==void 0)return t[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return t[i]=r,r}return{has:function(i){return e(i)!==null},init:function(i){i.isWebGL2?(e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance")):(e("WEBGL_depth_texture"),e("OES_texture_float"),e("OES_texture_half_float"),e("OES_texture_half_float_linear"),e("OES_standard_derivatives"),e("OES_element_index_uint"),e("OES_vertex_array_object"),e("ANGLE_instanced_arrays")),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture")},get:function(i){const r=e(i);return r===null&&console.warn("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function hd(n,t,e,i){const r={},s=new WeakMap;function o(u){const p=u.target;p.index!==null&&t.remove(p.index);for(const _ in p.attributes)t.remove(p.attributes[_]);for(const _ in p.morphAttributes){const g=p.morphAttributes[_];for(let m=0,f=g.length;m<f;m++)t.remove(g[m])}p.removeEventListener("dispose",o),delete r[p.id];const d=s.get(p);d&&(t.remove(d),s.delete(p)),i.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,e.memory.geometries--}function a(u,p){return r[p.id]===!0||(p.addEventListener("dispose",o),r[p.id]=!0,e.memory.geometries++),p}function c(u){const p=u.attributes;for(const _ in p)t.update(p[_],n.ARRAY_BUFFER);const d=u.morphAttributes;for(const _ in d){const g=d[_];for(let m=0,f=g.length;m<f;m++)t.update(g[m],n.ARRAY_BUFFER)}}function l(u){const p=[],d=u.index,_=u.attributes.position;let g=0;if(d!==null){const x=d.array;g=d.version;for(let v=0,A=x.length;v<A;v+=3){const N=x[v+0],w=x[v+1],R=x[v+2];p.push(N,w,w,R,R,N)}}else if(_!==void 0){const x=_.array;g=_.version;for(let v=0,A=x.length/3-1;v<A;v+=3){const N=v+0,w=v+1,R=v+2;p.push(N,w,w,R,R,N)}}else return;const m=new(uc(p)?vc:gc)(p,1);m.version=g;const f=s.get(u);f&&t.remove(f),s.set(u,m)}function h(u){const p=s.get(u);if(p){const d=u.index;d!==null&&p.version<d.version&&l(u)}else l(u);return s.get(u)}return{get:a,update:c,getWireframeAttribute:h}}function ud(n,t,e,i){const r=i.isWebGL2;let s;function o(d){s=d}let a,c;function l(d){a=d.type,c=d.bytesPerElement}function h(d,_){n.drawElements(s,_,a,d*c),e.update(_,s,1)}function u(d,_,g){if(g===0)return;let m,f;if(r)m=n,f="drawElementsInstanced";else if(m=t.get("ANGLE_instanced_arrays"),f="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[f](s,_,a,d*c,g),e.update(_,s,g)}function p(d,_,g){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<g;f++)this.render(d[f]/c,_[f]);else{m.multiDrawElementsWEBGL(s,_,0,a,d,0,g);let f=0;for(let x=0;x<g;x++)f+=_[x];e.update(f,s,1)}}this.setMode=o,this.setIndex=l,this.render=h,this.renderInstances=u,this.renderMultiDraw=p}function fd(n){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(e.calls++,o){case n.TRIANGLES:e.triangles+=a*(s/3);break;case n.LINES:e.lines+=a*(s/2);break;case n.LINE_STRIP:e.lines+=a*(s-1);break;case n.LINE_LOOP:e.lines+=a*s;break;case n.POINTS:e.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:r,update:i}}function dd(n,t){return n[0]-t[0]}function pd(n,t){return Math.abs(t[1])-Math.abs(n[1])}function md(n,t,e){const i={},r=new Float32Array(8),s=new WeakMap,o=new re,a=[];for(let l=0;l<8;l++)a[l]=[l,0];function c(l,h,u){const p=l.morphTargetInfluences;if(t.isWebGL2===!0){const d=h.morphAttributes.position||h.morphAttributes.normal||h.morphAttributes.color,_=d!==void 0?d.length:0;let g=s.get(h);if(g===void 0||g.count!==_){let b=function(){B.dispose(),s.delete(h),h.removeEventListener("dispose",b)};g!==void 0&&g.texture.dispose();const x=h.morphAttributes.position!==void 0,v=h.morphAttributes.normal!==void 0,A=h.morphAttributes.color!==void 0,N=h.morphAttributes.position||[],w=h.morphAttributes.normal||[],R=h.morphAttributes.color||[];let C=0;x===!0&&(C=1),v===!0&&(C=2),A===!0&&(C=3);let S=h.attributes.position.count*C,E=1;S>t.maxTextureSize&&(E=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);const D=new Float32Array(S*E*4*_),B=new pc(D,S,E,_);B.type=bn,B.needsUpdate=!0;const z=C*4;for(let U=0;U<_;U++){const O=N[U],q=w[U],Z=R[U],k=S*E*4*U;for(let J=0;J<O.count;J++){const $=J*z;x===!0&&(o.fromBufferAttribute(O,J),D[k+$+0]=o.x,D[k+$+1]=o.y,D[k+$+2]=o.z,D[k+$+3]=0),v===!0&&(o.fromBufferAttribute(q,J),D[k+$+4]=o.x,D[k+$+5]=o.y,D[k+$+6]=o.z,D[k+$+7]=0),A===!0&&(o.fromBufferAttribute(Z,J),D[k+$+8]=o.x,D[k+$+9]=o.y,D[k+$+10]=o.z,D[k+$+11]=Z.itemSize===4?o.w:1)}}g={count:_,texture:B,size:new st(S,E)},s.set(h,g),h.addEventListener("dispose",b)}let m=0;for(let x=0;x<p.length;x++)m+=p[x];const f=h.morphTargetsRelative?1:1-m;u.getUniforms().setValue(n,"morphTargetBaseInfluence",f),u.getUniforms().setValue(n,"morphTargetInfluences",p),u.getUniforms().setValue(n,"morphTargetsTexture",g.texture,e),u.getUniforms().setValue(n,"morphTargetsTextureSize",g.size)}else{const d=p===void 0?0:p.length;let _=i[h.id];if(_===void 0||_.length!==d){_=[];for(let v=0;v<d;v++)_[v]=[v,0];i[h.id]=_}for(let v=0;v<d;v++){const A=_[v];A[0]=v,A[1]=p[v]}_.sort(pd);for(let v=0;v<8;v++)v<d&&_[v][1]?(a[v][0]=_[v][0],a[v][1]=_[v][1]):(a[v][0]=Number.MAX_SAFE_INTEGER,a[v][1]=0);a.sort(dd);const g=h.morphAttributes.position,m=h.morphAttributes.normal;let f=0;for(let v=0;v<8;v++){const A=a[v],N=A[0],w=A[1];N!==Number.MAX_SAFE_INTEGER&&w?(g&&h.getAttribute("morphTarget"+v)!==g[N]&&h.setAttribute("morphTarget"+v,g[N]),m&&h.getAttribute("morphNormal"+v)!==m[N]&&h.setAttribute("morphNormal"+v,m[N]),r[v]=w,f+=w):(g&&h.hasAttribute("morphTarget"+v)===!0&&h.deleteAttribute("morphTarget"+v),m&&h.hasAttribute("morphNormal"+v)===!0&&h.deleteAttribute("morphNormal"+v),r[v]=0)}const x=h.morphTargetsRelative?1:1-f;u.getUniforms().setValue(n,"morphTargetBaseInfluence",x),u.getUniforms().setValue(n,"morphTargetInfluences",r)}}return{update:c}}function _d(n,t,e,i){let r=new WeakMap;function s(c){const l=i.render.frame,h=c.geometry,u=t.get(c,h);if(r.get(u)!==l&&(t.update(u),r.set(u,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),r.get(c)!==l&&(e.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,n.ARRAY_BUFFER),r.set(c,l))),c.isSkinnedMesh){const p=c.skeleton;r.get(p)!==l&&(p.update(),r.set(p,l))}return u}function o(){r=new WeakMap}function a(c){const l=c.target;l.removeEventListener("dispose",a),e.remove(l.instanceMatrix),l.instanceColor!==null&&e.remove(l.instanceColor)}return{update:s,dispose:o}}class Ec extends Fe{constructor(t,e,i,r,s,o,a,c,l,h){if(h=h!==void 0?h:Xn,h!==Xn&&h!==yi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&h===Xn&&(i=An),i===void 0&&h===yi&&(i=Wn),super(null,r,s,o,a,c,h,i,l),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:Ce,this.minFilter=c!==void 0?c:Ce,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const Tc=new Fe,Ac=new Ec(1,1);Ac.compareFunction=hc;const bc=new pc,wc=new Ql,Rc=new Sc,ba=[],wa=[],Ra=new Float32Array(16),Ca=new Float32Array(9),Pa=new Float32Array(4);function Ci(n,t,e){const i=n[0];if(i<=0||i>0)return n;const r=t*e;let s=ba[r];if(s===void 0&&(s=new Float32Array(r),ba[r]=s),t!==0){i.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=e,n[o].toArray(s,a)}return s}function de(n,t){if(n.length!==t.length)return!1;for(let e=0,i=n.length;e<i;e++)if(n[e]!==t[e])return!1;return!0}function pe(n,t){for(let e=0,i=t.length;e<i;e++)n[e]=t[e]}function Wr(n,t){let e=wa[t];e===void 0&&(e=new Int32Array(t),wa[t]=e);for(let i=0;i!==t;++i)e[i]=n.allocateTextureUnit();return e}function gd(n,t){const e=this.cache;e[0]!==t&&(n.uniform1f(this.addr,t),e[0]=t)}function vd(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(de(e,t))return;n.uniform2fv(this.addr,t),pe(e,t)}}function xd(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(n.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(de(e,t))return;n.uniform3fv(this.addr,t),pe(e,t)}}function Md(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(de(e,t))return;n.uniform4fv(this.addr,t),pe(e,t)}}function Sd(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(de(e,t))return;n.uniformMatrix2fv(this.addr,!1,t),pe(e,t)}else{if(de(e,i))return;Pa.set(i),n.uniformMatrix2fv(this.addr,!1,Pa),pe(e,i)}}function yd(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(de(e,t))return;n.uniformMatrix3fv(this.addr,!1,t),pe(e,t)}else{if(de(e,i))return;Ca.set(i),n.uniformMatrix3fv(this.addr,!1,Ca),pe(e,i)}}function Ed(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(de(e,t))return;n.uniformMatrix4fv(this.addr,!1,t),pe(e,t)}else{if(de(e,i))return;Ra.set(i),n.uniformMatrix4fv(this.addr,!1,Ra),pe(e,i)}}function Td(n,t){const e=this.cache;e[0]!==t&&(n.uniform1i(this.addr,t),e[0]=t)}function Ad(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(de(e,t))return;n.uniform2iv(this.addr,t),pe(e,t)}}function bd(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(de(e,t))return;n.uniform3iv(this.addr,t),pe(e,t)}}function wd(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(de(e,t))return;n.uniform4iv(this.addr,t),pe(e,t)}}function Rd(n,t){const e=this.cache;e[0]!==t&&(n.uniform1ui(this.addr,t),e[0]=t)}function Cd(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(de(e,t))return;n.uniform2uiv(this.addr,t),pe(e,t)}}function Pd(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(de(e,t))return;n.uniform3uiv(this.addr,t),pe(e,t)}}function Ld(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(de(e,t))return;n.uniform4uiv(this.addr,t),pe(e,t)}}function Dd(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);const s=this.type===n.SAMPLER_2D_SHADOW?Ac:Tc;e.setTexture2D(t||s,r)}function Ud(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture3D(t||wc,r)}function Id(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTextureCube(t||Rc,r)}function Nd(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture2DArray(t||bc,r)}function Fd(n){switch(n){case 5126:return gd;case 35664:return vd;case 35665:return xd;case 35666:return Md;case 35674:return Sd;case 35675:return yd;case 35676:return Ed;case 5124:case 35670:return Td;case 35667:case 35671:return Ad;case 35668:case 35672:return bd;case 35669:case 35673:return wd;case 5125:return Rd;case 36294:return Cd;case 36295:return Pd;case 36296:return Ld;case 35678:case 36198:case 36298:case 36306:case 35682:return Dd;case 35679:case 36299:case 36307:return Ud;case 35680:case 36300:case 36308:case 36293:return Id;case 36289:case 36303:case 36311:case 36292:return Nd}}function Od(n,t){n.uniform1fv(this.addr,t)}function Bd(n,t){const e=Ci(t,this.size,2);n.uniform2fv(this.addr,e)}function zd(n,t){const e=Ci(t,this.size,3);n.uniform3fv(this.addr,e)}function Gd(n,t){const e=Ci(t,this.size,4);n.uniform4fv(this.addr,e)}function Hd(n,t){const e=Ci(t,this.size,4);n.uniformMatrix2fv(this.addr,!1,e)}function Vd(n,t){const e=Ci(t,this.size,9);n.uniformMatrix3fv(this.addr,!1,e)}function kd(n,t){const e=Ci(t,this.size,16);n.uniformMatrix4fv(this.addr,!1,e)}function Wd(n,t){n.uniform1iv(this.addr,t)}function Xd(n,t){n.uniform2iv(this.addr,t)}function qd(n,t){n.uniform3iv(this.addr,t)}function Yd(n,t){n.uniform4iv(this.addr,t)}function Zd(n,t){n.uniform1uiv(this.addr,t)}function Jd(n,t){n.uniform2uiv(this.addr,t)}function Kd(n,t){n.uniform3uiv(this.addr,t)}function jd(n,t){n.uniform4uiv(this.addr,t)}function $d(n,t,e){const i=this.cache,r=t.length,s=Wr(e,r);de(i,s)||(n.uniform1iv(this.addr,s),pe(i,s));for(let o=0;o!==r;++o)e.setTexture2D(t[o]||Tc,s[o])}function Qd(n,t,e){const i=this.cache,r=t.length,s=Wr(e,r);de(i,s)||(n.uniform1iv(this.addr,s),pe(i,s));for(let o=0;o!==r;++o)e.setTexture3D(t[o]||wc,s[o])}function tp(n,t,e){const i=this.cache,r=t.length,s=Wr(e,r);de(i,s)||(n.uniform1iv(this.addr,s),pe(i,s));for(let o=0;o!==r;++o)e.setTextureCube(t[o]||Rc,s[o])}function ep(n,t,e){const i=this.cache,r=t.length,s=Wr(e,r);de(i,s)||(n.uniform1iv(this.addr,s),pe(i,s));for(let o=0;o!==r;++o)e.setTexture2DArray(t[o]||bc,s[o])}function np(n){switch(n){case 5126:return Od;case 35664:return Bd;case 35665:return zd;case 35666:return Gd;case 35674:return Hd;case 35675:return Vd;case 35676:return kd;case 5124:case 35670:return Wd;case 35667:case 35671:return Xd;case 35668:case 35672:return qd;case 35669:case 35673:return Yd;case 5125:return Zd;case 36294:return Jd;case 36295:return Kd;case 36296:return jd;case 35678:case 36198:case 36298:case 36306:case 35682:return $d;case 35679:case 36299:case 36307:return Qd;case 35680:case 36300:case 36308:case 36293:return tp;case 36289:case 36303:case 36311:case 36292:return ep}}class ip{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=Fd(e.type)}}class rp{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=np(e.type)}}class sp{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){const r=this.seq;for(let s=0,o=r.length;s!==o;++s){const a=r[s];a.setValue(t,e[a.id],i)}}}const Cs=/(\w+)(\])?(\[|\.)?/g;function La(n,t){n.seq.push(t),n.map[t.id]=t}function op(n,t,e){const i=n.name,r=i.length;for(Cs.lastIndex=0;;){const s=Cs.exec(i),o=Cs.lastIndex;let a=s[1];const c=s[2]==="]",l=s[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===r){La(e,l===void 0?new ip(a,n,t):new rp(a,n,t));break}else{let u=e.map[a];u===void 0&&(u=new sp(a),La(e,u)),e=u}}}class Rr{constructor(t,e){this.seq=[],this.map={};const i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const s=t.getActiveUniform(e,r),o=t.getUniformLocation(e,s.name);op(s,o,this)}}setValue(t,e,i,r){const s=this.map[e];s!==void 0&&s.setValue(t,i,r)}setOptional(t,e,i){const r=e[i];r!==void 0&&this.setValue(t,i,r)}static upload(t,e,i,r){for(let s=0,o=e.length;s!==o;++s){const a=e[s],c=i[a.id];c.needsUpdate!==!1&&a.setValue(t,c.value,r)}}static seqWithValue(t,e){const i=[];for(let r=0,s=t.length;r!==s;++r){const o=t[r];o.id in e&&i.push(o)}return i}}function Da(n,t,e){const i=n.createShader(t);return n.shaderSource(i,e),n.compileShader(i),i}const ap=37297;let cp=0;function lp(n,t){const e=n.split(`
`),i=[],r=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let o=r;o<s;o++){const a=o+1;i.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return i.join(`
`)}function hp(n){const t=jt.getPrimaries(jt.workingColorSpace),e=jt.getPrimaries(n);let i;switch(t===e?i="":t===Ur&&e===Dr?i="LinearDisplayP3ToLinearSRGB":t===Dr&&e===Ur&&(i="LinearSRGBToLinearDisplayP3"),n){case on:case Hr:return[i,"LinearTransferOETF"];case he:case no:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[i,"LinearTransferOETF"]}}function Ua(n,t,e){const i=n.getShaderParameter(t,n.COMPILE_STATUS),r=n.getShaderInfoLog(t).trim();if(i&&r==="")return"";const s=/ERROR: 0:(\d+)/.exec(r);if(s){const o=parseInt(s[1]);return e.toUpperCase()+`

`+r+`

`+lp(n.getShaderSource(t),o)}else return r}function up(n,t){const e=hp(t);return`vec4 ${n}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function fp(n,t){let e;switch(t){case El:e="Linear";break;case Tl:e="Reinhard";break;case Al:e="OptimizedCineon";break;case zr:e="ACESFilmic";break;case wl:e="AgX";break;case bl:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+n+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}function dp(n){return[n.extensionDerivatives||n.envMapCubeUVHeight||n.bumpMap||n.normalMapTangentSpace||n.clearcoatNormalMap||n.flatShading||n.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(n.extensionFragDepth||n.logarithmicDepthBuffer)&&n.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",n.extensionDrawBuffers&&n.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(n.extensionShaderTextureLOD||n.envMap||n.transmission)&&n.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(pi).join(`
`)}function pp(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(pi).join(`
`)}function mp(n){const t=[];for(const e in n){const i=n[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function _p(n,t){const e={},i=n.getProgramParameter(t,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(t,r),o=s.name;let a=1;s.type===n.FLOAT_MAT2&&(a=2),s.type===n.FLOAT_MAT3&&(a=3),s.type===n.FLOAT_MAT4&&(a=4),e[o]={type:s.type,location:n.getAttribLocation(t,o),locationSize:a}}return e}function pi(n){return n!==""}function Ia(n,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Na(n,t){return n.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const gp=/^[ \t]*#include +<([\w\d./]+)>/gm;function qs(n){return n.replace(gp,xp)}const vp=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function xp(n,t){let e=zt[t];if(e===void 0){const i=vp.get(t);if(i!==void 0)e=zt[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return qs(e)}const Mp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Fa(n){return n.replace(Mp,Sp)}function Sp(n,t,e,i){let r="";for(let s=parseInt(t);s<parseInt(e);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Oa(n){let t="precision "+n.precision+` float;
precision `+n.precision+" int;";return n.precision==="highp"?t+=`
#define HIGH_PRECISION`:n.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function yp(n){let t="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===$a?t="SHADOWMAP_TYPE_PCF":n.shadowMapType===Br?t="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===pn&&(t="SHADOWMAP_TYPE_VSM"),t}function Ep(n){let t="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Mi:case Si:t="ENVMAP_TYPE_CUBE";break;case Gr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Tp(n){let t="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case Si:t="ENVMAP_MODE_REFRACTION";break}return t}function Ap(n){let t="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Qa:t="ENVMAP_BLENDING_MULTIPLY";break;case Sl:t="ENVMAP_BLENDING_MIX";break;case yl:t="ENVMAP_BLENDING_ADD";break}return t}function bp(n){const t=n.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:i,maxMip:e}}function wp(n,t,e,i){const r=n.getContext(),s=e.defines;let o=e.vertexShader,a=e.fragmentShader;const c=yp(e),l=Ep(e),h=Tp(e),u=Ap(e),p=bp(e),d=e.isWebGL2?"":dp(e),_=pp(e),g=mp(s),m=r.createProgram();let f,x,v=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(pi).join(`
`),f.length>0&&(f+=`
`),x=[d,"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(pi).join(`
`),x.length>0&&(x+=`
`)):(f=[Oa(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors&&e.isWebGL2?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(pi).join(`
`),x=[d,Oa(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",p?"#define CUBEUV_TEXEL_WIDTH "+p.texelWidth:"",p?"#define CUBEUV_TEXEL_HEIGHT "+p.texelHeight:"",p?"#define CUBEUV_MAX_MIP "+p.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==gn?"#define TONE_MAPPING":"",e.toneMapping!==gn?zt.tonemapping_pars_fragment:"",e.toneMapping!==gn?fp("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",zt.colorspace_pars_fragment,up("linearToOutputTexel",e.outputColorSpace),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(pi).join(`
`)),o=qs(o),o=Ia(o,e),o=Na(o,e),a=qs(a),a=Ia(a,e),a=Na(a,e),o=Fa(o),a=Fa(a),e.isWebGL2&&e.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,f=[_,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,x=["precision mediump sampler2DArray;","#define varying in",e.glslVersion===na?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===na?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+x);const A=v+f+o,N=v+x+a,w=Da(r,r.VERTEX_SHADER,A),R=Da(r,r.FRAGMENT_SHADER,N);r.attachShader(m,w),r.attachShader(m,R),e.index0AttributeName!==void 0?r.bindAttribLocation(m,0,e.index0AttributeName):e.morphTargets===!0&&r.bindAttribLocation(m,0,"position"),r.linkProgram(m);function C(B){if(n.debug.checkShaderErrors){const z=r.getProgramInfoLog(m).trim(),b=r.getShaderInfoLog(w).trim(),U=r.getShaderInfoLog(R).trim();let O=!0,q=!0;if(r.getProgramParameter(m,r.LINK_STATUS)===!1)if(O=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,m,w,R);else{const Z=Ua(r,w,"vertex"),k=Ua(r,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(m,r.VALIDATE_STATUS)+`

Program Info Log: `+z+`
`+Z+`
`+k)}else z!==""?console.warn("THREE.WebGLProgram: Program Info Log:",z):(b===""||U==="")&&(q=!1);q&&(B.diagnostics={runnable:O,programLog:z,vertexShader:{log:b,prefix:f},fragmentShader:{log:U,prefix:x}})}r.deleteShader(w),r.deleteShader(R),S=new Rr(r,m),E=_p(r,m)}let S;this.getUniforms=function(){return S===void 0&&C(this),S};let E;this.getAttributes=function(){return E===void 0&&C(this),E};let D=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return D===!1&&(D=r.getProgramParameter(m,ap)),D},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(m),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=cp++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=w,this.fragmentShader=R,this}let Rp=0;class Cp{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,i=t.fragmentShader,r=this._getShaderStage(e),s=this._getShaderStage(i),o=this._getShaderCacheForMaterial(t);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){const e=this.shaderCache;let i=e.get(t);return i===void 0&&(i=new Pp(t),e.set(t,i)),i}}class Pp{constructor(t){this.id=Rp++,this.code=t,this.usedTimes=0}}function Lp(n,t,e,i,r,s,o){const a=new ro,c=new Cp,l=[],h=r.isWebGL2,u=r.logarithmicDepthBuffer,p=r.vertexTextures;let d=r.precision;const _={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(S){return S===0?"uv":`uv${S}`}function m(S,E,D,B,z){const b=B.fog,U=z.geometry,O=S.isMeshStandardMaterial?B.environment:null,q=(S.isMeshStandardMaterial?e:t).get(S.envMap||O),Z=q&&q.mapping===Gr?q.image.height:null,k=_[S.type];S.precision!==null&&(d=r.getMaxPrecision(S.precision),d!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",d,"instead."));const J=U.morphAttributes.position||U.morphAttributes.normal||U.morphAttributes.color,$=J!==void 0?J.length:0;let lt=0;U.morphAttributes.position!==void 0&&(lt=1),U.morphAttributes.normal!==void 0&&(lt=2),U.morphAttributes.color!==void 0&&(lt=3);let Y,tt,dt,St;if(k){const be=rn[k];Y=be.vertexShader,tt=be.fragmentShader}else Y=S.vertexShader,tt=S.fragmentShader,c.update(S),dt=c.getVertexShaderID(S),St=c.getFragmentShaderID(S);const _t=n.getRenderTarget(),Ct=z.isInstancedMesh===!0,It=z.isBatchedMesh===!0,yt=!!S.map,Dt=!!S.matcap,L=!!q,ot=!!S.aoMap,j=!!S.lightMap,rt=!!S.bumpMap,K=!!S.normalMap,Tt=!!S.displacementMap,pt=!!S.emissiveMap,y=!!S.metalnessMap,M=!!S.roughnessMap,H=S.anisotropy>0,it=S.clearcoat>0,et=S.iridescence>0,Q=S.sheen>0,Mt=S.transmission>0,ht=H&&!!S.anisotropyMap,gt=it&&!!S.clearcoatMap,bt=it&&!!S.clearcoatNormalMap,Ft=it&&!!S.clearcoatRoughnessMap,nt=et&&!!S.iridescenceMap,Jt=et&&!!S.iridescenceThicknessMap,Xt=Q&&!!S.sheenColorMap,Ut=Q&&!!S.sheenRoughnessMap,At=!!S.specularMap,xt=!!S.specularColorMap,Bt=!!S.specularIntensityMap,Kt=Mt&&!!S.transmissionMap,ae=Mt&&!!S.thicknessMap,Vt=!!S.gradientMap,at=!!S.alphaMap,F=S.alphaTest>0,ut=!!S.alphaHash,ft=!!S.extensions,Pt=!!U.attributes.uv1,wt=!!U.attributes.uv2,te=!!U.attributes.uv3;let ee=gn;return S.toneMapped&&(_t===null||_t.isXRRenderTarget===!0)&&(ee=n.toneMapping),{isWebGL2:h,shaderID:k,shaderType:S.type,shaderName:S.name,vertexShader:Y,fragmentShader:tt,defines:S.defines,customVertexShaderID:dt,customFragmentShaderID:St,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:d,batching:It,instancing:Ct,instancingColor:Ct&&z.instanceColor!==null,supportsVertexTextures:p,outputColorSpace:_t===null?n.outputColorSpace:_t.isXRRenderTarget===!0?_t.texture.colorSpace:on,map:yt,matcap:Dt,envMap:L,envMapMode:L&&q.mapping,envMapCubeUVHeight:Z,aoMap:ot,lightMap:j,bumpMap:rt,normalMap:K,displacementMap:p&&Tt,emissiveMap:pt,normalMapObjectSpace:K&&S.normalMapType===zl,normalMapTangentSpace:K&&S.normalMapType===lc,metalnessMap:y,roughnessMap:M,anisotropy:H,anisotropyMap:ht,clearcoat:it,clearcoatMap:gt,clearcoatNormalMap:bt,clearcoatRoughnessMap:Ft,iridescence:et,iridescenceMap:nt,iridescenceThicknessMap:Jt,sheen:Q,sheenColorMap:Xt,sheenRoughnessMap:Ut,specularMap:At,specularColorMap:xt,specularIntensityMap:Bt,transmission:Mt,transmissionMap:Kt,thicknessMap:ae,gradientMap:Vt,opaque:S.transparent===!1&&S.blending===gi,alphaMap:at,alphaTest:F,alphaHash:ut,combine:S.combine,mapUv:yt&&g(S.map.channel),aoMapUv:ot&&g(S.aoMap.channel),lightMapUv:j&&g(S.lightMap.channel),bumpMapUv:rt&&g(S.bumpMap.channel),normalMapUv:K&&g(S.normalMap.channel),displacementMapUv:Tt&&g(S.displacementMap.channel),emissiveMapUv:pt&&g(S.emissiveMap.channel),metalnessMapUv:y&&g(S.metalnessMap.channel),roughnessMapUv:M&&g(S.roughnessMap.channel),anisotropyMapUv:ht&&g(S.anisotropyMap.channel),clearcoatMapUv:gt&&g(S.clearcoatMap.channel),clearcoatNormalMapUv:bt&&g(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ft&&g(S.clearcoatRoughnessMap.channel),iridescenceMapUv:nt&&g(S.iridescenceMap.channel),iridescenceThicknessMapUv:Jt&&g(S.iridescenceThicknessMap.channel),sheenColorMapUv:Xt&&g(S.sheenColorMap.channel),sheenRoughnessMapUv:Ut&&g(S.sheenRoughnessMap.channel),specularMapUv:At&&g(S.specularMap.channel),specularColorMapUv:xt&&g(S.specularColorMap.channel),specularIntensityMapUv:Bt&&g(S.specularIntensityMap.channel),transmissionMapUv:Kt&&g(S.transmissionMap.channel),thicknessMapUv:ae&&g(S.thicknessMap.channel),alphaMapUv:at&&g(S.alphaMap.channel),vertexTangents:!!U.attributes.tangent&&(K||H),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!U.attributes.color&&U.attributes.color.itemSize===4,vertexUv1s:Pt,vertexUv2s:wt,vertexUv3s:te,pointsUvs:z.isPoints===!0&&!!U.attributes.uv&&(yt||at),fog:!!b,useFog:S.fog===!0,fogExp2:b&&b.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:u,skinning:z.isSkinnedMesh===!0,morphTargets:U.morphAttributes.position!==void 0,morphNormals:U.morphAttributes.normal!==void 0,morphColors:U.morphAttributes.color!==void 0,morphTargetsCount:$,morphTextureStride:lt,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:S.dithering,shadowMapEnabled:n.shadowMap.enabled&&D.length>0,shadowMapType:n.shadowMap.type,toneMapping:ee,useLegacyLights:n._useLegacyLights,decodeVideoTexture:yt&&S.map.isVideoTexture===!0&&jt.getTransfer(S.map.colorSpace)===ie,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Ne,flipSided:S.side===Le,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionDerivatives:ft&&S.extensions.derivatives===!0,extensionFragDepth:ft&&S.extensions.fragDepth===!0,extensionDrawBuffers:ft&&S.extensions.drawBuffers===!0,extensionShaderTextureLOD:ft&&S.extensions.shaderTextureLOD===!0,extensionClipCullDistance:ft&&S.extensions.clipCullDistance&&i.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:h||i.has("EXT_frag_depth"),rendererExtensionDrawBuffers:h||i.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:h||i.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()}}function f(S){const E=[];if(S.shaderID?E.push(S.shaderID):(E.push(S.customVertexShaderID),E.push(S.customFragmentShaderID)),S.defines!==void 0)for(const D in S.defines)E.push(D),E.push(S.defines[D]);return S.isRawShaderMaterial===!1&&(x(E,S),v(E,S),E.push(n.outputColorSpace)),E.push(S.customProgramCacheKey),E.join()}function x(S,E){S.push(E.precision),S.push(E.outputColorSpace),S.push(E.envMapMode),S.push(E.envMapCubeUVHeight),S.push(E.mapUv),S.push(E.alphaMapUv),S.push(E.lightMapUv),S.push(E.aoMapUv),S.push(E.bumpMapUv),S.push(E.normalMapUv),S.push(E.displacementMapUv),S.push(E.emissiveMapUv),S.push(E.metalnessMapUv),S.push(E.roughnessMapUv),S.push(E.anisotropyMapUv),S.push(E.clearcoatMapUv),S.push(E.clearcoatNormalMapUv),S.push(E.clearcoatRoughnessMapUv),S.push(E.iridescenceMapUv),S.push(E.iridescenceThicknessMapUv),S.push(E.sheenColorMapUv),S.push(E.sheenRoughnessMapUv),S.push(E.specularMapUv),S.push(E.specularColorMapUv),S.push(E.specularIntensityMapUv),S.push(E.transmissionMapUv),S.push(E.thicknessMapUv),S.push(E.combine),S.push(E.fogExp2),S.push(E.sizeAttenuation),S.push(E.morphTargetsCount),S.push(E.morphAttributeCount),S.push(E.numDirLights),S.push(E.numPointLights),S.push(E.numSpotLights),S.push(E.numSpotLightMaps),S.push(E.numHemiLights),S.push(E.numRectAreaLights),S.push(E.numDirLightShadows),S.push(E.numPointLightShadows),S.push(E.numSpotLightShadows),S.push(E.numSpotLightShadowsWithMaps),S.push(E.numLightProbes),S.push(E.shadowMapType),S.push(E.toneMapping),S.push(E.numClippingPlanes),S.push(E.numClipIntersection),S.push(E.depthPacking)}function v(S,E){a.disableAll(),E.isWebGL2&&a.enable(0),E.supportsVertexTextures&&a.enable(1),E.instancing&&a.enable(2),E.instancingColor&&a.enable(3),E.matcap&&a.enable(4),E.envMap&&a.enable(5),E.normalMapObjectSpace&&a.enable(6),E.normalMapTangentSpace&&a.enable(7),E.clearcoat&&a.enable(8),E.iridescence&&a.enable(9),E.alphaTest&&a.enable(10),E.vertexColors&&a.enable(11),E.vertexAlphas&&a.enable(12),E.vertexUv1s&&a.enable(13),E.vertexUv2s&&a.enable(14),E.vertexUv3s&&a.enable(15),E.vertexTangents&&a.enable(16),E.anisotropy&&a.enable(17),E.alphaHash&&a.enable(18),E.batching&&a.enable(19),S.push(a.mask),a.disableAll(),E.fog&&a.enable(0),E.useFog&&a.enable(1),E.flatShading&&a.enable(2),E.logarithmicDepthBuffer&&a.enable(3),E.skinning&&a.enable(4),E.morphTargets&&a.enable(5),E.morphNormals&&a.enable(6),E.morphColors&&a.enable(7),E.premultipliedAlpha&&a.enable(8),E.shadowMapEnabled&&a.enable(9),E.useLegacyLights&&a.enable(10),E.doubleSided&&a.enable(11),E.flipSided&&a.enable(12),E.useDepthPacking&&a.enable(13),E.dithering&&a.enable(14),E.transmission&&a.enable(15),E.sheen&&a.enable(16),E.opaque&&a.enable(17),E.pointsUvs&&a.enable(18),E.decodeVideoTexture&&a.enable(19),S.push(a.mask)}function A(S){const E=_[S.type];let D;if(E){const B=rn[E];D=fh.clone(B.uniforms)}else D=S.uniforms;return D}function N(S,E){let D;for(let B=0,z=l.length;B<z;B++){const b=l[B];if(b.cacheKey===E){D=b,++D.usedTimes;break}}return D===void 0&&(D=new wp(n,E,S,s),l.push(D)),D}function w(S){if(--S.usedTimes===0){const E=l.indexOf(S);l[E]=l[l.length-1],l.pop(),S.destroy()}}function R(S){c.remove(S)}function C(){c.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:A,acquireProgram:N,releaseProgram:w,releaseShaderCache:R,programs:l,dispose:C}}function Dp(){let n=new WeakMap;function t(s){let o=n.get(s);return o===void 0&&(o={},n.set(s,o)),o}function e(s){n.delete(s)}function i(s,o,a){n.get(s)[o]=a}function r(){n=new WeakMap}return{get:t,remove:e,update:i,dispose:r}}function Up(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.material.id!==t.material.id?n.material.id-t.material.id:n.z!==t.z?n.z-t.z:n.id-t.id}function Ba(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.z!==t.z?t.z-n.z:n.id-t.id}function za(){const n=[];let t=0;const e=[],i=[],r=[];function s(){t=0,e.length=0,i.length=0,r.length=0}function o(u,p,d,_,g,m){let f=n[t];return f===void 0?(f={id:u.id,object:u,geometry:p,material:d,groupOrder:_,renderOrder:u.renderOrder,z:g,group:m},n[t]=f):(f.id=u.id,f.object=u,f.geometry=p,f.material=d,f.groupOrder=_,f.renderOrder=u.renderOrder,f.z=g,f.group=m),t++,f}function a(u,p,d,_,g,m){const f=o(u,p,d,_,g,m);d.transmission>0?i.push(f):d.transparent===!0?r.push(f):e.push(f)}function c(u,p,d,_,g,m){const f=o(u,p,d,_,g,m);d.transmission>0?i.unshift(f):d.transparent===!0?r.unshift(f):e.unshift(f)}function l(u,p){e.length>1&&e.sort(u||Up),i.length>1&&i.sort(p||Ba),r.length>1&&r.sort(p||Ba)}function h(){for(let u=t,p=n.length;u<p;u++){const d=n[u];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:e,transmissive:i,transparent:r,init:s,push:a,unshift:c,finish:h,sort:l}}function Ip(){let n=new WeakMap;function t(i,r){const s=n.get(i);let o;return s===void 0?(o=new za,n.set(i,[o])):r>=s.length?(o=new za,s.push(o)):o=s[r],o}function e(){n=new WeakMap}return{get:t,dispose:e}}function Np(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new P,color:new Yt};break;case"SpotLight":e={position:new P,direction:new P,color:new Yt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new P,color:new Yt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new P,skyColor:new Yt,groundColor:new Yt};break;case"RectAreaLight":e={color:new Yt,position:new P,halfWidth:new P,halfHeight:new P};break}return n[t.id]=e,e}}}function Fp(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new st};break;case"SpotLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new st};break;case"PointLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new st,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[t.id]=e,e}}}let Op=0;function Bp(n,t){return(t.castShadow?2:0)-(n.castShadow?2:0)+(t.map?1:0)-(n.map?1:0)}function zp(n,t){const e=new Np,i=Fp(),r={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)r.probe.push(new P);const s=new P,o=new ue,a=new ue;function c(h,u){let p=0,d=0,_=0;for(let B=0;B<9;B++)r.probe[B].set(0,0,0);let g=0,m=0,f=0,x=0,v=0,A=0,N=0,w=0,R=0,C=0,S=0;h.sort(Bp);const E=u===!0?Math.PI:1;for(let B=0,z=h.length;B<z;B++){const b=h[B],U=b.color,O=b.intensity,q=b.distance,Z=b.shadow&&b.shadow.map?b.shadow.map.texture:null;if(b.isAmbientLight)p+=U.r*O*E,d+=U.g*O*E,_+=U.b*O*E;else if(b.isLightProbe){for(let k=0;k<9;k++)r.probe[k].addScaledVector(b.sh.coefficients[k],O);S++}else if(b.isDirectionalLight){const k=e.get(b);if(k.color.copy(b.color).multiplyScalar(b.intensity*E),b.castShadow){const J=b.shadow,$=i.get(b);$.shadowBias=J.bias,$.shadowNormalBias=J.normalBias,$.shadowRadius=J.radius,$.shadowMapSize=J.mapSize,r.directionalShadow[g]=$,r.directionalShadowMap[g]=Z,r.directionalShadowMatrix[g]=b.shadow.matrix,A++}r.directional[g]=k,g++}else if(b.isSpotLight){const k=e.get(b);k.position.setFromMatrixPosition(b.matrixWorld),k.color.copy(U).multiplyScalar(O*E),k.distance=q,k.coneCos=Math.cos(b.angle),k.penumbraCos=Math.cos(b.angle*(1-b.penumbra)),k.decay=b.decay,r.spot[f]=k;const J=b.shadow;if(b.map&&(r.spotLightMap[R]=b.map,R++,J.updateMatrices(b),b.castShadow&&C++),r.spotLightMatrix[f]=J.matrix,b.castShadow){const $=i.get(b);$.shadowBias=J.bias,$.shadowNormalBias=J.normalBias,$.shadowRadius=J.radius,$.shadowMapSize=J.mapSize,r.spotShadow[f]=$,r.spotShadowMap[f]=Z,w++}f++}else if(b.isRectAreaLight){const k=e.get(b);k.color.copy(U).multiplyScalar(O),k.halfWidth.set(b.width*.5,0,0),k.halfHeight.set(0,b.height*.5,0),r.rectArea[x]=k,x++}else if(b.isPointLight){const k=e.get(b);if(k.color.copy(b.color).multiplyScalar(b.intensity*E),k.distance=b.distance,k.decay=b.decay,b.castShadow){const J=b.shadow,$=i.get(b);$.shadowBias=J.bias,$.shadowNormalBias=J.normalBias,$.shadowRadius=J.radius,$.shadowMapSize=J.mapSize,$.shadowCameraNear=J.camera.near,$.shadowCameraFar=J.camera.far,r.pointShadow[m]=$,r.pointShadowMap[m]=Z,r.pointShadowMatrix[m]=b.shadow.matrix,N++}r.point[m]=k,m++}else if(b.isHemisphereLight){const k=e.get(b);k.skyColor.copy(b.color).multiplyScalar(O*E),k.groundColor.copy(b.groundColor).multiplyScalar(O*E),r.hemi[v]=k,v++}}x>0&&(t.isWebGL2?n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ct.LTC_FLOAT_1,r.rectAreaLTC2=ct.LTC_FLOAT_2):(r.rectAreaLTC1=ct.LTC_HALF_1,r.rectAreaLTC2=ct.LTC_HALF_2):n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ct.LTC_FLOAT_1,r.rectAreaLTC2=ct.LTC_FLOAT_2):n.has("OES_texture_half_float_linear")===!0?(r.rectAreaLTC1=ct.LTC_HALF_1,r.rectAreaLTC2=ct.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),r.ambient[0]=p,r.ambient[1]=d,r.ambient[2]=_;const D=r.hash;(D.directionalLength!==g||D.pointLength!==m||D.spotLength!==f||D.rectAreaLength!==x||D.hemiLength!==v||D.numDirectionalShadows!==A||D.numPointShadows!==N||D.numSpotShadows!==w||D.numSpotMaps!==R||D.numLightProbes!==S)&&(r.directional.length=g,r.spot.length=f,r.rectArea.length=x,r.point.length=m,r.hemi.length=v,r.directionalShadow.length=A,r.directionalShadowMap.length=A,r.pointShadow.length=N,r.pointShadowMap.length=N,r.spotShadow.length=w,r.spotShadowMap.length=w,r.directionalShadowMatrix.length=A,r.pointShadowMatrix.length=N,r.spotLightMatrix.length=w+R-C,r.spotLightMap.length=R,r.numSpotLightShadowsWithMaps=C,r.numLightProbes=S,D.directionalLength=g,D.pointLength=m,D.spotLength=f,D.rectAreaLength=x,D.hemiLength=v,D.numDirectionalShadows=A,D.numPointShadows=N,D.numSpotShadows=w,D.numSpotMaps=R,D.numLightProbes=S,r.version=Op++)}function l(h,u){let p=0,d=0,_=0,g=0,m=0;const f=u.matrixWorldInverse;for(let x=0,v=h.length;x<v;x++){const A=h[x];if(A.isDirectionalLight){const N=r.directional[p];N.direction.setFromMatrixPosition(A.matrixWorld),s.setFromMatrixPosition(A.target.matrixWorld),N.direction.sub(s),N.direction.transformDirection(f),p++}else if(A.isSpotLight){const N=r.spot[_];N.position.setFromMatrixPosition(A.matrixWorld),N.position.applyMatrix4(f),N.direction.setFromMatrixPosition(A.matrixWorld),s.setFromMatrixPosition(A.target.matrixWorld),N.direction.sub(s),N.direction.transformDirection(f),_++}else if(A.isRectAreaLight){const N=r.rectArea[g];N.position.setFromMatrixPosition(A.matrixWorld),N.position.applyMatrix4(f),a.identity(),o.copy(A.matrixWorld),o.premultiply(f),a.extractRotation(o),N.halfWidth.set(A.width*.5,0,0),N.halfHeight.set(0,A.height*.5,0),N.halfWidth.applyMatrix4(a),N.halfHeight.applyMatrix4(a),g++}else if(A.isPointLight){const N=r.point[d];N.position.setFromMatrixPosition(A.matrixWorld),N.position.applyMatrix4(f),d++}else if(A.isHemisphereLight){const N=r.hemi[m];N.direction.setFromMatrixPosition(A.matrixWorld),N.direction.transformDirection(f),m++}}}return{setup:c,setupView:l,state:r}}function Ga(n,t){const e=new zp(n,t),i=[],r=[];function s(){i.length=0,r.length=0}function o(u){i.push(u)}function a(u){r.push(u)}function c(u){e.setup(i,u)}function l(u){e.setupView(i,u)}return{init:s,state:{lightsArray:i,shadowsArray:r,lights:e},setupLights:c,setupLightsView:l,pushLight:o,pushShadow:a}}function Gp(n,t){let e=new WeakMap;function i(s,o=0){const a=e.get(s);let c;return a===void 0?(c=new Ga(n,t),e.set(s,[c])):o>=a.length?(c=new Ga(n,t),a.push(c)):c=a[o],c}function r(){e=new WeakMap}return{get:i,dispose:r}}class Hp extends Qi{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ol,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Vp extends Qi{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const kp=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Wp=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Xp(n,t,e){let i=new so;const r=new st,s=new st,o=new re,a=new Hp({depthPacking:Bl}),c=new Vp,l={},h=e.maxTextureSize,u={[Ln]:Le,[Le]:Ln,[Ne]:Ne},p=new Zn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new st},radius:{value:4}},vertexShader:kp,fragmentShader:Wp}),d=p.clone();d.defines.HORIZONTAL_PASS=1;const _=new Be;_.setAttribute("position",new sn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const g=new en(_,p),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=$a;let f=this.type;this.render=function(w,R,C){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||w.length===0)return;const S=n.getRenderTarget(),E=n.getActiveCubeFace(),D=n.getActiveMipmapLevel(),B=n.state;B.setBlending(wn),B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);const z=f!==pn&&this.type===pn,b=f===pn&&this.type!==pn;for(let U=0,O=w.length;U<O;U++){const q=w[U],Z=q.shadow;if(Z===void 0){console.warn("THREE.WebGLShadowMap:",q,"has no shadow.");continue}if(Z.autoUpdate===!1&&Z.needsUpdate===!1)continue;r.copy(Z.mapSize);const k=Z.getFrameExtents();if(r.multiply(k),s.copy(Z.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/k.x),r.x=s.x*k.x,Z.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/k.y),r.y=s.y*k.y,Z.mapSize.y=s.y)),Z.map===null||z===!0||b===!0){const $=this.type!==pn?{minFilter:Ce,magFilter:Ce}:{};Z.map!==null&&Z.map.dispose(),Z.map=new Dn(r.x,r.y,$),Z.map.texture.name=q.name+".shadowMap",Z.camera.updateProjectionMatrix()}n.setRenderTarget(Z.map),n.clear();const J=Z.getViewportCount();for(let $=0;$<J;$++){const lt=Z.getViewport($);o.set(s.x*lt.x,s.y*lt.y,s.x*lt.z,s.y*lt.w),B.viewport(o),Z.updateMatrices(q,$),i=Z.getFrustum(),A(R,C,Z.camera,q,this.type)}Z.isPointLightShadow!==!0&&this.type===pn&&x(Z,C),Z.needsUpdate=!1}f=this.type,m.needsUpdate=!1,n.setRenderTarget(S,E,D)};function x(w,R){const C=t.update(g);p.defines.VSM_SAMPLES!==w.blurSamples&&(p.defines.VSM_SAMPLES=w.blurSamples,d.defines.VSM_SAMPLES=w.blurSamples,p.needsUpdate=!0,d.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new Dn(r.x,r.y)),p.uniforms.shadow_pass.value=w.map.texture,p.uniforms.resolution.value=w.mapSize,p.uniforms.radius.value=w.radius,n.setRenderTarget(w.mapPass),n.clear(),n.renderBufferDirect(R,null,C,p,g,null),d.uniforms.shadow_pass.value=w.mapPass.texture,d.uniforms.resolution.value=w.mapSize,d.uniforms.radius.value=w.radius,n.setRenderTarget(w.map),n.clear(),n.renderBufferDirect(R,null,C,d,g,null)}function v(w,R,C,S){let E=null;const D=C.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(D!==void 0)E=D;else if(E=C.isPointLight===!0?c:a,n.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0){const B=E.uuid,z=R.uuid;let b=l[B];b===void 0&&(b={},l[B]=b);let U=b[z];U===void 0&&(U=E.clone(),b[z]=U,R.addEventListener("dispose",N)),E=U}if(E.visible=R.visible,E.wireframe=R.wireframe,S===pn?E.side=R.shadowSide!==null?R.shadowSide:R.side:E.side=R.shadowSide!==null?R.shadowSide:u[R.side],E.alphaMap=R.alphaMap,E.alphaTest=R.alphaTest,E.map=R.map,E.clipShadows=R.clipShadows,E.clippingPlanes=R.clippingPlanes,E.clipIntersection=R.clipIntersection,E.displacementMap=R.displacementMap,E.displacementScale=R.displacementScale,E.displacementBias=R.displacementBias,E.wireframeLinewidth=R.wireframeLinewidth,E.linewidth=R.linewidth,C.isPointLight===!0&&E.isMeshDistanceMaterial===!0){const B=n.properties.get(E);B.light=C}return E}function A(w,R,C,S,E){if(w.visible===!1)return;if(w.layers.test(R.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&E===pn)&&(!w.frustumCulled||i.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,w.matrixWorld);const z=t.update(w),b=w.material;if(Array.isArray(b)){const U=z.groups;for(let O=0,q=U.length;O<q;O++){const Z=U[O],k=b[Z.materialIndex];if(k&&k.visible){const J=v(w,k,S,E);w.onBeforeShadow(n,w,R,C,z,J,Z),n.renderBufferDirect(C,null,z,J,w,Z),w.onAfterShadow(n,w,R,C,z,J,Z)}}}else if(b.visible){const U=v(w,b,S,E);w.onBeforeShadow(n,w,R,C,z,U,null),n.renderBufferDirect(C,null,z,U,w,null),w.onAfterShadow(n,w,R,C,z,U,null)}}const B=w.children;for(let z=0,b=B.length;z<b;z++)A(B[z],R,C,S,E)}function N(w){w.target.removeEventListener("dispose",N);for(const C in l){const S=l[C],E=w.target.uuid;E in S&&(S[E].dispose(),delete S[E])}}}function qp(n,t,e){const i=e.isWebGL2;function r(){let F=!1;const ut=new re;let ft=null;const Pt=new re(0,0,0,0);return{setMask:function(wt){ft!==wt&&!F&&(n.colorMask(wt,wt,wt,wt),ft=wt)},setLocked:function(wt){F=wt},setClear:function(wt,te,ee,me,be){be===!0&&(wt*=me,te*=me,ee*=me),ut.set(wt,te,ee,me),Pt.equals(ut)===!1&&(n.clearColor(wt,te,ee,me),Pt.copy(ut))},reset:function(){F=!1,ft=null,Pt.set(-1,0,0,0)}}}function s(){let F=!1,ut=null,ft=null,Pt=null;return{setTest:function(wt){wt?It(n.DEPTH_TEST):yt(n.DEPTH_TEST)},setMask:function(wt){ut!==wt&&!F&&(n.depthMask(wt),ut=wt)},setFunc:function(wt){if(ft!==wt){switch(wt){case pl:n.depthFunc(n.NEVER);break;case ml:n.depthFunc(n.ALWAYS);break;case _l:n.depthFunc(n.LESS);break;case Cr:n.depthFunc(n.LEQUAL);break;case gl:n.depthFunc(n.EQUAL);break;case vl:n.depthFunc(n.GEQUAL);break;case xl:n.depthFunc(n.GREATER);break;case Ml:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}ft=wt}},setLocked:function(wt){F=wt},setClear:function(wt){Pt!==wt&&(n.clearDepth(wt),Pt=wt)},reset:function(){F=!1,ut=null,ft=null,Pt=null}}}function o(){let F=!1,ut=null,ft=null,Pt=null,wt=null,te=null,ee=null,me=null,be=null;return{setTest:function(ne){F||(ne?It(n.STENCIL_TEST):yt(n.STENCIL_TEST))},setMask:function(ne){ut!==ne&&!F&&(n.stencilMask(ne),ut=ne)},setFunc:function(ne,we,nn){(ft!==ne||Pt!==we||wt!==nn)&&(n.stencilFunc(ne,we,nn),ft=ne,Pt=we,wt=nn)},setOp:function(ne,we,nn){(te!==ne||ee!==we||me!==nn)&&(n.stencilOp(ne,we,nn),te=ne,ee=we,me=nn)},setLocked:function(ne){F=ne},setClear:function(ne){be!==ne&&(n.clearStencil(ne),be=ne)},reset:function(){F=!1,ut=null,ft=null,Pt=null,wt=null,te=null,ee=null,me=null,be=null}}}const a=new r,c=new s,l=new o,h=new WeakMap,u=new WeakMap;let p={},d={},_=new WeakMap,g=[],m=null,f=!1,x=null,v=null,A=null,N=null,w=null,R=null,C=null,S=new Yt(0,0,0),E=0,D=!1,B=null,z=null,b=null,U=null,O=null;const q=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let Z=!1,k=0;const J=n.getParameter(n.VERSION);J.indexOf("WebGL")!==-1?(k=parseFloat(/^WebGL (\d)/.exec(J)[1]),Z=k>=1):J.indexOf("OpenGL ES")!==-1&&(k=parseFloat(/^OpenGL ES (\d)/.exec(J)[1]),Z=k>=2);let $=null,lt={};const Y=n.getParameter(n.SCISSOR_BOX),tt=n.getParameter(n.VIEWPORT),dt=new re().fromArray(Y),St=new re().fromArray(tt);function _t(F,ut,ft,Pt){const wt=new Uint8Array(4),te=n.createTexture();n.bindTexture(F,te),n.texParameteri(F,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(F,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let ee=0;ee<ft;ee++)i&&(F===n.TEXTURE_3D||F===n.TEXTURE_2D_ARRAY)?n.texImage3D(ut,0,n.RGBA,1,1,Pt,0,n.RGBA,n.UNSIGNED_BYTE,wt):n.texImage2D(ut+ee,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,wt);return te}const Ct={};Ct[n.TEXTURE_2D]=_t(n.TEXTURE_2D,n.TEXTURE_2D,1),Ct[n.TEXTURE_CUBE_MAP]=_t(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),i&&(Ct[n.TEXTURE_2D_ARRAY]=_t(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Ct[n.TEXTURE_3D]=_t(n.TEXTURE_3D,n.TEXTURE_3D,1,1)),a.setClear(0,0,0,1),c.setClear(1),l.setClear(0),It(n.DEPTH_TEST),c.setFunc(Cr),pt(!1),y(yo),It(n.CULL_FACE),K(wn);function It(F){p[F]!==!0&&(n.enable(F),p[F]=!0)}function yt(F){p[F]!==!1&&(n.disable(F),p[F]=!1)}function Dt(F,ut){return d[F]!==ut?(n.bindFramebuffer(F,ut),d[F]=ut,i&&(F===n.DRAW_FRAMEBUFFER&&(d[n.FRAMEBUFFER]=ut),F===n.FRAMEBUFFER&&(d[n.DRAW_FRAMEBUFFER]=ut)),!0):!1}function L(F,ut){let ft=g,Pt=!1;if(F)if(ft=_.get(ut),ft===void 0&&(ft=[],_.set(ut,ft)),F.isWebGLMultipleRenderTargets){const wt=F.texture;if(ft.length!==wt.length||ft[0]!==n.COLOR_ATTACHMENT0){for(let te=0,ee=wt.length;te<ee;te++)ft[te]=n.COLOR_ATTACHMENT0+te;ft.length=wt.length,Pt=!0}}else ft[0]!==n.COLOR_ATTACHMENT0&&(ft[0]=n.COLOR_ATTACHMENT0,Pt=!0);else ft[0]!==n.BACK&&(ft[0]=n.BACK,Pt=!0);Pt&&(e.isWebGL2?n.drawBuffers(ft):t.get("WEBGL_draw_buffers").drawBuffersWEBGL(ft))}function ot(F){return m!==F?(n.useProgram(F),m=F,!0):!1}const j={[Vn]:n.FUNC_ADD,[Qc]:n.FUNC_SUBTRACT,[tl]:n.FUNC_REVERSE_SUBTRACT};if(i)j[bo]=n.MIN,j[wo]=n.MAX;else{const F=t.get("EXT_blend_minmax");F!==null&&(j[bo]=F.MIN_EXT,j[wo]=F.MAX_EXT)}const rt={[el]:n.ZERO,[nl]:n.ONE,[il]:n.SRC_COLOR,[Bs]:n.SRC_ALPHA,[ll]:n.SRC_ALPHA_SATURATE,[al]:n.DST_COLOR,[sl]:n.DST_ALPHA,[rl]:n.ONE_MINUS_SRC_COLOR,[zs]:n.ONE_MINUS_SRC_ALPHA,[cl]:n.ONE_MINUS_DST_COLOR,[ol]:n.ONE_MINUS_DST_ALPHA,[hl]:n.CONSTANT_COLOR,[ul]:n.ONE_MINUS_CONSTANT_COLOR,[fl]:n.CONSTANT_ALPHA,[dl]:n.ONE_MINUS_CONSTANT_ALPHA};function K(F,ut,ft,Pt,wt,te,ee,me,be,ne){if(F===wn){f===!0&&(yt(n.BLEND),f=!1);return}if(f===!1&&(It(n.BLEND),f=!0),F!==$c){if(F!==x||ne!==D){if((v!==Vn||w!==Vn)&&(n.blendEquation(n.FUNC_ADD),v=Vn,w=Vn),ne)switch(F){case gi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Eo:n.blendFunc(n.ONE,n.ONE);break;case To:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Ao:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",F);break}else switch(F){case gi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Eo:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case To:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Ao:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",F);break}A=null,N=null,R=null,C=null,S.set(0,0,0),E=0,x=F,D=ne}return}wt=wt||ut,te=te||ft,ee=ee||Pt,(ut!==v||wt!==w)&&(n.blendEquationSeparate(j[ut],j[wt]),v=ut,w=wt),(ft!==A||Pt!==N||te!==R||ee!==C)&&(n.blendFuncSeparate(rt[ft],rt[Pt],rt[te],rt[ee]),A=ft,N=Pt,R=te,C=ee),(me.equals(S)===!1||be!==E)&&(n.blendColor(me.r,me.g,me.b,be),S.copy(me),E=be),x=F,D=!1}function Tt(F,ut){F.side===Ne?yt(n.CULL_FACE):It(n.CULL_FACE);let ft=F.side===Le;ut&&(ft=!ft),pt(ft),F.blending===gi&&F.transparent===!1?K(wn):K(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),c.setFunc(F.depthFunc),c.setTest(F.depthTest),c.setMask(F.depthWrite),a.setMask(F.colorWrite);const Pt=F.stencilWrite;l.setTest(Pt),Pt&&(l.setMask(F.stencilWriteMask),l.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),l.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),H(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?It(n.SAMPLE_ALPHA_TO_COVERAGE):yt(n.SAMPLE_ALPHA_TO_COVERAGE)}function pt(F){B!==F&&(F?n.frontFace(n.CW):n.frontFace(n.CCW),B=F)}function y(F){F!==Kc?(It(n.CULL_FACE),F!==z&&(F===yo?n.cullFace(n.BACK):F===jc?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):yt(n.CULL_FACE),z=F}function M(F){F!==b&&(Z&&n.lineWidth(F),b=F)}function H(F,ut,ft){F?(It(n.POLYGON_OFFSET_FILL),(U!==ut||O!==ft)&&(n.polygonOffset(ut,ft),U=ut,O=ft)):yt(n.POLYGON_OFFSET_FILL)}function it(F){F?It(n.SCISSOR_TEST):yt(n.SCISSOR_TEST)}function et(F){F===void 0&&(F=n.TEXTURE0+q-1),$!==F&&(n.activeTexture(F),$=F)}function Q(F,ut,ft){ft===void 0&&($===null?ft=n.TEXTURE0+q-1:ft=$);let Pt=lt[ft];Pt===void 0&&(Pt={type:void 0,texture:void 0},lt[ft]=Pt),(Pt.type!==F||Pt.texture!==ut)&&($!==ft&&(n.activeTexture(ft),$=ft),n.bindTexture(F,ut||Ct[F]),Pt.type=F,Pt.texture=ut)}function Mt(){const F=lt[$];F!==void 0&&F.type!==void 0&&(n.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function ht(){try{n.compressedTexImage2D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function gt(){try{n.compressedTexImage3D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function bt(){try{n.texSubImage2D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Ft(){try{n.texSubImage3D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function nt(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Jt(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Xt(){try{n.texStorage2D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Ut(){try{n.texStorage3D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function At(){try{n.texImage2D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function xt(){try{n.texImage3D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Bt(F){dt.equals(F)===!1&&(n.scissor(F.x,F.y,F.z,F.w),dt.copy(F))}function Kt(F){St.equals(F)===!1&&(n.viewport(F.x,F.y,F.z,F.w),St.copy(F))}function ae(F,ut){let ft=u.get(ut);ft===void 0&&(ft=new WeakMap,u.set(ut,ft));let Pt=ft.get(F);Pt===void 0&&(Pt=n.getUniformBlockIndex(ut,F.name),ft.set(F,Pt))}function Vt(F,ut){const Pt=u.get(ut).get(F);h.get(ut)!==Pt&&(n.uniformBlockBinding(ut,Pt,F.__bindingPointIndex),h.set(ut,Pt))}function at(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),i===!0&&(n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null)),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),p={},$=null,lt={},d={},_=new WeakMap,g=[],m=null,f=!1,x=null,v=null,A=null,N=null,w=null,R=null,C=null,S=new Yt(0,0,0),E=0,D=!1,B=null,z=null,b=null,U=null,O=null,dt.set(0,0,n.canvas.width,n.canvas.height),St.set(0,0,n.canvas.width,n.canvas.height),a.reset(),c.reset(),l.reset()}return{buffers:{color:a,depth:c,stencil:l},enable:It,disable:yt,bindFramebuffer:Dt,drawBuffers:L,useProgram:ot,setBlending:K,setMaterial:Tt,setFlipSided:pt,setCullFace:y,setLineWidth:M,setPolygonOffset:H,setScissorTest:it,activeTexture:et,bindTexture:Q,unbindTexture:Mt,compressedTexImage2D:ht,compressedTexImage3D:gt,texImage2D:At,texImage3D:xt,updateUBOMapping:ae,uniformBlockBinding:Vt,texStorage2D:Xt,texStorage3D:Ut,texSubImage2D:bt,texSubImage3D:Ft,compressedTexSubImage2D:nt,compressedTexSubImage3D:Jt,scissor:Bt,viewport:Kt,reset:at}}function Yp(n,t,e,i,r,s,o){const a=r.isWebGL2,c=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new WeakMap;let u;const p=new WeakMap;let d=!1;try{d=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(y,M){return d?new OffscreenCanvas(y,M):Nr("canvas")}function g(y,M,H,it){let et=1;if((y.width>it||y.height>it)&&(et=it/Math.max(y.width,y.height)),et<1||M===!0)if(typeof HTMLImageElement<"u"&&y instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&y instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&y instanceof ImageBitmap){const Q=M?Xs:Math.floor,Mt=Q(et*y.width),ht=Q(et*y.height);u===void 0&&(u=_(Mt,ht));const gt=H?_(Mt,ht):u;return gt.width=Mt,gt.height=ht,gt.getContext("2d").drawImage(y,0,0,Mt,ht),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+y.width+"x"+y.height+") to ("+Mt+"x"+ht+")."),gt}else return"data"in y&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+y.width+"x"+y.height+")."),y;return y}function m(y){return ia(y.width)&&ia(y.height)}function f(y){return a?!1:y.wrapS!==Qe||y.wrapT!==Qe||y.minFilter!==Ce&&y.minFilter!==Xe}function x(y,M){return y.generateMipmaps&&M&&y.minFilter!==Ce&&y.minFilter!==Xe}function v(y){n.generateMipmap(y)}function A(y,M,H,it,et=!1){if(a===!1)return M;if(y!==null){if(n[y]!==void 0)return n[y];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+y+"'")}let Q=M;if(M===n.RED&&(H===n.FLOAT&&(Q=n.R32F),H===n.HALF_FLOAT&&(Q=n.R16F),H===n.UNSIGNED_BYTE&&(Q=n.R8)),M===n.RED_INTEGER&&(H===n.UNSIGNED_BYTE&&(Q=n.R8UI),H===n.UNSIGNED_SHORT&&(Q=n.R16UI),H===n.UNSIGNED_INT&&(Q=n.R32UI),H===n.BYTE&&(Q=n.R8I),H===n.SHORT&&(Q=n.R16I),H===n.INT&&(Q=n.R32I)),M===n.RG&&(H===n.FLOAT&&(Q=n.RG32F),H===n.HALF_FLOAT&&(Q=n.RG16F),H===n.UNSIGNED_BYTE&&(Q=n.RG8)),M===n.RGBA){const Mt=et?Lr:jt.getTransfer(it);H===n.FLOAT&&(Q=n.RGBA32F),H===n.HALF_FLOAT&&(Q=n.RGBA16F),H===n.UNSIGNED_BYTE&&(Q=Mt===ie?n.SRGB8_ALPHA8:n.RGBA8),H===n.UNSIGNED_SHORT_4_4_4_4&&(Q=n.RGBA4),H===n.UNSIGNED_SHORT_5_5_5_1&&(Q=n.RGB5_A1)}return(Q===n.R16F||Q===n.R32F||Q===n.RG16F||Q===n.RG32F||Q===n.RGBA16F||Q===n.RGBA32F)&&t.get("EXT_color_buffer_float"),Q}function N(y,M,H){return x(y,H)===!0||y.isFramebufferTexture&&y.minFilter!==Ce&&y.minFilter!==Xe?Math.log2(Math.max(M.width,M.height))+1:y.mipmaps!==void 0&&y.mipmaps.length>0?y.mipmaps.length:y.isCompressedTexture&&Array.isArray(y.image)?M.mipmaps.length:1}function w(y){return y===Ce||y===Ro||y===ts?n.NEAREST:n.LINEAR}function R(y){const M=y.target;M.removeEventListener("dispose",R),S(M),M.isVideoTexture&&h.delete(M)}function C(y){const M=y.target;M.removeEventListener("dispose",C),D(M)}function S(y){const M=i.get(y);if(M.__webglInit===void 0)return;const H=y.source,it=p.get(H);if(it){const et=it[M.__cacheKey];et.usedTimes--,et.usedTimes===0&&E(y),Object.keys(it).length===0&&p.delete(H)}i.remove(y)}function E(y){const M=i.get(y);n.deleteTexture(M.__webglTexture);const H=y.source,it=p.get(H);delete it[M.__cacheKey],o.memory.textures--}function D(y){const M=y.texture,H=i.get(y),it=i.get(M);if(it.__webglTexture!==void 0&&(n.deleteTexture(it.__webglTexture),o.memory.textures--),y.depthTexture&&y.depthTexture.dispose(),y.isWebGLCubeRenderTarget)for(let et=0;et<6;et++){if(Array.isArray(H.__webglFramebuffer[et]))for(let Q=0;Q<H.__webglFramebuffer[et].length;Q++)n.deleteFramebuffer(H.__webglFramebuffer[et][Q]);else n.deleteFramebuffer(H.__webglFramebuffer[et]);H.__webglDepthbuffer&&n.deleteRenderbuffer(H.__webglDepthbuffer[et])}else{if(Array.isArray(H.__webglFramebuffer))for(let et=0;et<H.__webglFramebuffer.length;et++)n.deleteFramebuffer(H.__webglFramebuffer[et]);else n.deleteFramebuffer(H.__webglFramebuffer);if(H.__webglDepthbuffer&&n.deleteRenderbuffer(H.__webglDepthbuffer),H.__webglMultisampledFramebuffer&&n.deleteFramebuffer(H.__webglMultisampledFramebuffer),H.__webglColorRenderbuffer)for(let et=0;et<H.__webglColorRenderbuffer.length;et++)H.__webglColorRenderbuffer[et]&&n.deleteRenderbuffer(H.__webglColorRenderbuffer[et]);H.__webglDepthRenderbuffer&&n.deleteRenderbuffer(H.__webglDepthRenderbuffer)}if(y.isWebGLMultipleRenderTargets)for(let et=0,Q=M.length;et<Q;et++){const Mt=i.get(M[et]);Mt.__webglTexture&&(n.deleteTexture(Mt.__webglTexture),o.memory.textures--),i.remove(M[et])}i.remove(M),i.remove(y)}let B=0;function z(){B=0}function b(){const y=B;return y>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+y+" texture units while this GPU supports only "+r.maxTextures),B+=1,y}function U(y){const M=[];return M.push(y.wrapS),M.push(y.wrapT),M.push(y.wrapR||0),M.push(y.magFilter),M.push(y.minFilter),M.push(y.anisotropy),M.push(y.internalFormat),M.push(y.format),M.push(y.type),M.push(y.generateMipmaps),M.push(y.premultiplyAlpha),M.push(y.flipY),M.push(y.unpackAlignment),M.push(y.colorSpace),M.join()}function O(y,M){const H=i.get(y);if(y.isVideoTexture&&Tt(y),y.isRenderTargetTexture===!1&&y.version>0&&H.__version!==y.version){const it=y.image;if(it===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(it.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{dt(H,y,M);return}}e.bindTexture(n.TEXTURE_2D,H.__webglTexture,n.TEXTURE0+M)}function q(y,M){const H=i.get(y);if(y.version>0&&H.__version!==y.version){dt(H,y,M);return}e.bindTexture(n.TEXTURE_2D_ARRAY,H.__webglTexture,n.TEXTURE0+M)}function Z(y,M){const H=i.get(y);if(y.version>0&&H.__version!==y.version){dt(H,y,M);return}e.bindTexture(n.TEXTURE_3D,H.__webglTexture,n.TEXTURE0+M)}function k(y,M){const H=i.get(y);if(y.version>0&&H.__version!==y.version){St(H,y,M);return}e.bindTexture(n.TEXTURE_CUBE_MAP,H.__webglTexture,n.TEXTURE0+M)}const J={[Pr]:n.REPEAT,[Qe]:n.CLAMP_TO_EDGE,[Vs]:n.MIRRORED_REPEAT},$={[Ce]:n.NEAREST,[Ro]:n.NEAREST_MIPMAP_NEAREST,[ts]:n.NEAREST_MIPMAP_LINEAR,[Xe]:n.LINEAR,[Rl]:n.LINEAR_MIPMAP_NEAREST,[Xi]:n.LINEAR_MIPMAP_LINEAR},lt={[Gl]:n.NEVER,[ql]:n.ALWAYS,[Hl]:n.LESS,[hc]:n.LEQUAL,[Vl]:n.EQUAL,[Xl]:n.GEQUAL,[kl]:n.GREATER,[Wl]:n.NOTEQUAL};function Y(y,M,H){if(H?(n.texParameteri(y,n.TEXTURE_WRAP_S,J[M.wrapS]),n.texParameteri(y,n.TEXTURE_WRAP_T,J[M.wrapT]),(y===n.TEXTURE_3D||y===n.TEXTURE_2D_ARRAY)&&n.texParameteri(y,n.TEXTURE_WRAP_R,J[M.wrapR]),n.texParameteri(y,n.TEXTURE_MAG_FILTER,$[M.magFilter]),n.texParameteri(y,n.TEXTURE_MIN_FILTER,$[M.minFilter])):(n.texParameteri(y,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(y,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),(y===n.TEXTURE_3D||y===n.TEXTURE_2D_ARRAY)&&n.texParameteri(y,n.TEXTURE_WRAP_R,n.CLAMP_TO_EDGE),(M.wrapS!==Qe||M.wrapT!==Qe)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),n.texParameteri(y,n.TEXTURE_MAG_FILTER,w(M.magFilter)),n.texParameteri(y,n.TEXTURE_MIN_FILTER,w(M.minFilter)),M.minFilter!==Ce&&M.minFilter!==Xe&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),M.compareFunction&&(n.texParameteri(y,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(y,n.TEXTURE_COMPARE_FUNC,lt[M.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){const it=t.get("EXT_texture_filter_anisotropic");if(M.magFilter===Ce||M.minFilter!==ts&&M.minFilter!==Xi||M.type===bn&&t.has("OES_texture_float_linear")===!1||a===!1&&M.type===qi&&t.has("OES_texture_half_float_linear")===!1)return;(M.anisotropy>1||i.get(M).__currentAnisotropy)&&(n.texParameterf(y,it.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,r.getMaxAnisotropy())),i.get(M).__currentAnisotropy=M.anisotropy)}}function tt(y,M){let H=!1;y.__webglInit===void 0&&(y.__webglInit=!0,M.addEventListener("dispose",R));const it=M.source;let et=p.get(it);et===void 0&&(et={},p.set(it,et));const Q=U(M);if(Q!==y.__cacheKey){et[Q]===void 0&&(et[Q]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,H=!0),et[Q].usedTimes++;const Mt=et[y.__cacheKey];Mt!==void 0&&(et[y.__cacheKey].usedTimes--,Mt.usedTimes===0&&E(M)),y.__cacheKey=Q,y.__webglTexture=et[Q].texture}return H}function dt(y,M,H){let it=n.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(it=n.TEXTURE_2D_ARRAY),M.isData3DTexture&&(it=n.TEXTURE_3D);const et=tt(y,M),Q=M.source;e.bindTexture(it,y.__webglTexture,n.TEXTURE0+H);const Mt=i.get(Q);if(Q.version!==Mt.__version||et===!0){e.activeTexture(n.TEXTURE0+H);const ht=jt.getPrimaries(jt.workingColorSpace),gt=M.colorSpace===qe?null:jt.getPrimaries(M.colorSpace),bt=M.colorSpace===qe||ht===gt?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,M.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,M.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,bt);const Ft=f(M)&&m(M.image)===!1;let nt=g(M.image,Ft,!1,r.maxTextureSize);nt=pt(M,nt);const Jt=m(nt)||a,Xt=s.convert(M.format,M.colorSpace);let Ut=s.convert(M.type),At=A(M.internalFormat,Xt,Ut,M.colorSpace,M.isVideoTexture);Y(it,M,Jt);let xt;const Bt=M.mipmaps,Kt=a&&M.isVideoTexture!==!0&&At!==ac,ae=Mt.__version===void 0||et===!0,Vt=N(M,nt,Jt);if(M.isDepthTexture)At=n.DEPTH_COMPONENT,a?M.type===bn?At=n.DEPTH_COMPONENT32F:M.type===An?At=n.DEPTH_COMPONENT24:M.type===Wn?At=n.DEPTH24_STENCIL8:At=n.DEPTH_COMPONENT16:M.type===bn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),M.format===Xn&&At===n.DEPTH_COMPONENT&&M.type!==eo&&M.type!==An&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),M.type=An,Ut=s.convert(M.type)),M.format===yi&&At===n.DEPTH_COMPONENT&&(At=n.DEPTH_STENCIL,M.type!==Wn&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),M.type=Wn,Ut=s.convert(M.type))),ae&&(Kt?e.texStorage2D(n.TEXTURE_2D,1,At,nt.width,nt.height):e.texImage2D(n.TEXTURE_2D,0,At,nt.width,nt.height,0,Xt,Ut,null));else if(M.isDataTexture)if(Bt.length>0&&Jt){Kt&&ae&&e.texStorage2D(n.TEXTURE_2D,Vt,At,Bt[0].width,Bt[0].height);for(let at=0,F=Bt.length;at<F;at++)xt=Bt[at],Kt?e.texSubImage2D(n.TEXTURE_2D,at,0,0,xt.width,xt.height,Xt,Ut,xt.data):e.texImage2D(n.TEXTURE_2D,at,At,xt.width,xt.height,0,Xt,Ut,xt.data);M.generateMipmaps=!1}else Kt?(ae&&e.texStorage2D(n.TEXTURE_2D,Vt,At,nt.width,nt.height),e.texSubImage2D(n.TEXTURE_2D,0,0,0,nt.width,nt.height,Xt,Ut,nt.data)):e.texImage2D(n.TEXTURE_2D,0,At,nt.width,nt.height,0,Xt,Ut,nt.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){Kt&&ae&&e.texStorage3D(n.TEXTURE_2D_ARRAY,Vt,At,Bt[0].width,Bt[0].height,nt.depth);for(let at=0,F=Bt.length;at<F;at++)xt=Bt[at],M.format!==tn?Xt!==null?Kt?e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,at,0,0,0,xt.width,xt.height,nt.depth,Xt,xt.data,0,0):e.compressedTexImage3D(n.TEXTURE_2D_ARRAY,at,At,xt.width,xt.height,nt.depth,0,xt.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Kt?e.texSubImage3D(n.TEXTURE_2D_ARRAY,at,0,0,0,xt.width,xt.height,nt.depth,Xt,Ut,xt.data):e.texImage3D(n.TEXTURE_2D_ARRAY,at,At,xt.width,xt.height,nt.depth,0,Xt,Ut,xt.data)}else{Kt&&ae&&e.texStorage2D(n.TEXTURE_2D,Vt,At,Bt[0].width,Bt[0].height);for(let at=0,F=Bt.length;at<F;at++)xt=Bt[at],M.format!==tn?Xt!==null?Kt?e.compressedTexSubImage2D(n.TEXTURE_2D,at,0,0,xt.width,xt.height,Xt,xt.data):e.compressedTexImage2D(n.TEXTURE_2D,at,At,xt.width,xt.height,0,xt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Kt?e.texSubImage2D(n.TEXTURE_2D,at,0,0,xt.width,xt.height,Xt,Ut,xt.data):e.texImage2D(n.TEXTURE_2D,at,At,xt.width,xt.height,0,Xt,Ut,xt.data)}else if(M.isDataArrayTexture)Kt?(ae&&e.texStorage3D(n.TEXTURE_2D_ARRAY,Vt,At,nt.width,nt.height,nt.depth),e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,nt.width,nt.height,nt.depth,Xt,Ut,nt.data)):e.texImage3D(n.TEXTURE_2D_ARRAY,0,At,nt.width,nt.height,nt.depth,0,Xt,Ut,nt.data);else if(M.isData3DTexture)Kt?(ae&&e.texStorage3D(n.TEXTURE_3D,Vt,At,nt.width,nt.height,nt.depth),e.texSubImage3D(n.TEXTURE_3D,0,0,0,0,nt.width,nt.height,nt.depth,Xt,Ut,nt.data)):e.texImage3D(n.TEXTURE_3D,0,At,nt.width,nt.height,nt.depth,0,Xt,Ut,nt.data);else if(M.isFramebufferTexture){if(ae)if(Kt)e.texStorage2D(n.TEXTURE_2D,Vt,At,nt.width,nt.height);else{let at=nt.width,F=nt.height;for(let ut=0;ut<Vt;ut++)e.texImage2D(n.TEXTURE_2D,ut,At,at,F,0,Xt,Ut,null),at>>=1,F>>=1}}else if(Bt.length>0&&Jt){Kt&&ae&&e.texStorage2D(n.TEXTURE_2D,Vt,At,Bt[0].width,Bt[0].height);for(let at=0,F=Bt.length;at<F;at++)xt=Bt[at],Kt?e.texSubImage2D(n.TEXTURE_2D,at,0,0,Xt,Ut,xt):e.texImage2D(n.TEXTURE_2D,at,At,Xt,Ut,xt);M.generateMipmaps=!1}else Kt?(ae&&e.texStorage2D(n.TEXTURE_2D,Vt,At,nt.width,nt.height),e.texSubImage2D(n.TEXTURE_2D,0,0,0,Xt,Ut,nt)):e.texImage2D(n.TEXTURE_2D,0,At,Xt,Ut,nt);x(M,Jt)&&v(it),Mt.__version=Q.version,M.onUpdate&&M.onUpdate(M)}y.__version=M.version}function St(y,M,H){if(M.image.length!==6)return;const it=tt(y,M),et=M.source;e.bindTexture(n.TEXTURE_CUBE_MAP,y.__webglTexture,n.TEXTURE0+H);const Q=i.get(et);if(et.version!==Q.__version||it===!0){e.activeTexture(n.TEXTURE0+H);const Mt=jt.getPrimaries(jt.workingColorSpace),ht=M.colorSpace===qe?null:jt.getPrimaries(M.colorSpace),gt=M.colorSpace===qe||Mt===ht?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,M.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,M.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,gt);const bt=M.isCompressedTexture||M.image[0].isCompressedTexture,Ft=M.image[0]&&M.image[0].isDataTexture,nt=[];for(let at=0;at<6;at++)!bt&&!Ft?nt[at]=g(M.image[at],!1,!0,r.maxCubemapSize):nt[at]=Ft?M.image[at].image:M.image[at],nt[at]=pt(M,nt[at]);const Jt=nt[0],Xt=m(Jt)||a,Ut=s.convert(M.format,M.colorSpace),At=s.convert(M.type),xt=A(M.internalFormat,Ut,At,M.colorSpace),Bt=a&&M.isVideoTexture!==!0,Kt=Q.__version===void 0||it===!0;let ae=N(M,Jt,Xt);Y(n.TEXTURE_CUBE_MAP,M,Xt);let Vt;if(bt){Bt&&Kt&&e.texStorage2D(n.TEXTURE_CUBE_MAP,ae,xt,Jt.width,Jt.height);for(let at=0;at<6;at++){Vt=nt[at].mipmaps;for(let F=0;F<Vt.length;F++){const ut=Vt[F];M.format!==tn?Ut!==null?Bt?e.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+at,F,0,0,ut.width,ut.height,Ut,ut.data):e.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+at,F,xt,ut.width,ut.height,0,ut.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Bt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+at,F,0,0,ut.width,ut.height,Ut,At,ut.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+at,F,xt,ut.width,ut.height,0,Ut,At,ut.data)}}}else{Vt=M.mipmaps,Bt&&Kt&&(Vt.length>0&&ae++,e.texStorage2D(n.TEXTURE_CUBE_MAP,ae,xt,nt[0].width,nt[0].height));for(let at=0;at<6;at++)if(Ft){Bt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,0,0,nt[at].width,nt[at].height,Ut,At,nt[at].data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,xt,nt[at].width,nt[at].height,0,Ut,At,nt[at].data);for(let F=0;F<Vt.length;F++){const ft=Vt[F].image[at].image;Bt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+at,F+1,0,0,ft.width,ft.height,Ut,At,ft.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+at,F+1,xt,ft.width,ft.height,0,Ut,At,ft.data)}}else{Bt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,0,0,Ut,At,nt[at]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,xt,Ut,At,nt[at]);for(let F=0;F<Vt.length;F++){const ut=Vt[F];Bt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+at,F+1,0,0,Ut,At,ut.image[at]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+at,F+1,xt,Ut,At,ut.image[at])}}}x(M,Xt)&&v(n.TEXTURE_CUBE_MAP),Q.__version=et.version,M.onUpdate&&M.onUpdate(M)}y.__version=M.version}function _t(y,M,H,it,et,Q){const Mt=s.convert(H.format,H.colorSpace),ht=s.convert(H.type),gt=A(H.internalFormat,Mt,ht,H.colorSpace);if(!i.get(M).__hasExternalTextures){const Ft=Math.max(1,M.width>>Q),nt=Math.max(1,M.height>>Q);et===n.TEXTURE_3D||et===n.TEXTURE_2D_ARRAY?e.texImage3D(et,Q,gt,Ft,nt,M.depth,0,Mt,ht,null):e.texImage2D(et,Q,gt,Ft,nt,0,Mt,ht,null)}e.bindFramebuffer(n.FRAMEBUFFER,y),K(M)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,it,et,i.get(H).__webglTexture,0,rt(M)):(et===n.TEXTURE_2D||et>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&et<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,it,et,i.get(H).__webglTexture,Q),e.bindFramebuffer(n.FRAMEBUFFER,null)}function Ct(y,M,H){if(n.bindRenderbuffer(n.RENDERBUFFER,y),M.depthBuffer&&!M.stencilBuffer){let it=a===!0?n.DEPTH_COMPONENT24:n.DEPTH_COMPONENT16;if(H||K(M)){const et=M.depthTexture;et&&et.isDepthTexture&&(et.type===bn?it=n.DEPTH_COMPONENT32F:et.type===An&&(it=n.DEPTH_COMPONENT24));const Q=rt(M);K(M)?c.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Q,it,M.width,M.height):n.renderbufferStorageMultisample(n.RENDERBUFFER,Q,it,M.width,M.height)}else n.renderbufferStorage(n.RENDERBUFFER,it,M.width,M.height);n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.RENDERBUFFER,y)}else if(M.depthBuffer&&M.stencilBuffer){const it=rt(M);H&&K(M)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,it,n.DEPTH24_STENCIL8,M.width,M.height):K(M)?c.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,it,n.DEPTH24_STENCIL8,M.width,M.height):n.renderbufferStorage(n.RENDERBUFFER,n.DEPTH_STENCIL,M.width,M.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.RENDERBUFFER,y)}else{const it=M.isWebGLMultipleRenderTargets===!0?M.texture:[M.texture];for(let et=0;et<it.length;et++){const Q=it[et],Mt=s.convert(Q.format,Q.colorSpace),ht=s.convert(Q.type),gt=A(Q.internalFormat,Mt,ht,Q.colorSpace),bt=rt(M);H&&K(M)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,bt,gt,M.width,M.height):K(M)?c.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,bt,gt,M.width,M.height):n.renderbufferStorage(n.RENDERBUFFER,gt,M.width,M.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function It(y,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(n.FRAMEBUFFER,y),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(M.depthTexture).__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),O(M.depthTexture,0);const it=i.get(M.depthTexture).__webglTexture,et=rt(M);if(M.depthTexture.format===Xn)K(M)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,it,0,et):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,it,0);else if(M.depthTexture.format===yi)K(M)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,it,0,et):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,it,0);else throw new Error("Unknown depthTexture format")}function yt(y){const M=i.get(y),H=y.isWebGLCubeRenderTarget===!0;if(y.depthTexture&&!M.__autoAllocateDepthBuffer){if(H)throw new Error("target.depthTexture not supported in Cube render targets");It(M.__webglFramebuffer,y)}else if(H){M.__webglDepthbuffer=[];for(let it=0;it<6;it++)e.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer[it]),M.__webglDepthbuffer[it]=n.createRenderbuffer(),Ct(M.__webglDepthbuffer[it],y,!1)}else e.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer=n.createRenderbuffer(),Ct(M.__webglDepthbuffer,y,!1);e.bindFramebuffer(n.FRAMEBUFFER,null)}function Dt(y,M,H){const it=i.get(y);M!==void 0&&_t(it.__webglFramebuffer,y,y.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),H!==void 0&&yt(y)}function L(y){const M=y.texture,H=i.get(y),it=i.get(M);y.addEventListener("dispose",C),y.isWebGLMultipleRenderTargets!==!0&&(it.__webglTexture===void 0&&(it.__webglTexture=n.createTexture()),it.__version=M.version,o.memory.textures++);const et=y.isWebGLCubeRenderTarget===!0,Q=y.isWebGLMultipleRenderTargets===!0,Mt=m(y)||a;if(et){H.__webglFramebuffer=[];for(let ht=0;ht<6;ht++)if(a&&M.mipmaps&&M.mipmaps.length>0){H.__webglFramebuffer[ht]=[];for(let gt=0;gt<M.mipmaps.length;gt++)H.__webglFramebuffer[ht][gt]=n.createFramebuffer()}else H.__webglFramebuffer[ht]=n.createFramebuffer()}else{if(a&&M.mipmaps&&M.mipmaps.length>0){H.__webglFramebuffer=[];for(let ht=0;ht<M.mipmaps.length;ht++)H.__webglFramebuffer[ht]=n.createFramebuffer()}else H.__webglFramebuffer=n.createFramebuffer();if(Q)if(r.drawBuffers){const ht=y.texture;for(let gt=0,bt=ht.length;gt<bt;gt++){const Ft=i.get(ht[gt]);Ft.__webglTexture===void 0&&(Ft.__webglTexture=n.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(a&&y.samples>0&&K(y)===!1){const ht=Q?M:[M];H.__webglMultisampledFramebuffer=n.createFramebuffer(),H.__webglColorRenderbuffer=[],e.bindFramebuffer(n.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let gt=0;gt<ht.length;gt++){const bt=ht[gt];H.__webglColorRenderbuffer[gt]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,H.__webglColorRenderbuffer[gt]);const Ft=s.convert(bt.format,bt.colorSpace),nt=s.convert(bt.type),Jt=A(bt.internalFormat,Ft,nt,bt.colorSpace,y.isXRRenderTarget===!0),Xt=rt(y);n.renderbufferStorageMultisample(n.RENDERBUFFER,Xt,Jt,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+gt,n.RENDERBUFFER,H.__webglColorRenderbuffer[gt])}n.bindRenderbuffer(n.RENDERBUFFER,null),y.depthBuffer&&(H.__webglDepthRenderbuffer=n.createRenderbuffer(),Ct(H.__webglDepthRenderbuffer,y,!0)),e.bindFramebuffer(n.FRAMEBUFFER,null)}}if(et){e.bindTexture(n.TEXTURE_CUBE_MAP,it.__webglTexture),Y(n.TEXTURE_CUBE_MAP,M,Mt);for(let ht=0;ht<6;ht++)if(a&&M.mipmaps&&M.mipmaps.length>0)for(let gt=0;gt<M.mipmaps.length;gt++)_t(H.__webglFramebuffer[ht][gt],y,M,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ht,gt);else _t(H.__webglFramebuffer[ht],y,M,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ht,0);x(M,Mt)&&v(n.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Q){const ht=y.texture;for(let gt=0,bt=ht.length;gt<bt;gt++){const Ft=ht[gt],nt=i.get(Ft);e.bindTexture(n.TEXTURE_2D,nt.__webglTexture),Y(n.TEXTURE_2D,Ft,Mt),_t(H.__webglFramebuffer,y,Ft,n.COLOR_ATTACHMENT0+gt,n.TEXTURE_2D,0),x(Ft,Mt)&&v(n.TEXTURE_2D)}e.unbindTexture()}else{let ht=n.TEXTURE_2D;if((y.isWebGL3DRenderTarget||y.isWebGLArrayRenderTarget)&&(a?ht=y.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),e.bindTexture(ht,it.__webglTexture),Y(ht,M,Mt),a&&M.mipmaps&&M.mipmaps.length>0)for(let gt=0;gt<M.mipmaps.length;gt++)_t(H.__webglFramebuffer[gt],y,M,n.COLOR_ATTACHMENT0,ht,gt);else _t(H.__webglFramebuffer,y,M,n.COLOR_ATTACHMENT0,ht,0);x(M,Mt)&&v(ht),e.unbindTexture()}y.depthBuffer&&yt(y)}function ot(y){const M=m(y)||a,H=y.isWebGLMultipleRenderTargets===!0?y.texture:[y.texture];for(let it=0,et=H.length;it<et;it++){const Q=H[it];if(x(Q,M)){const Mt=y.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,ht=i.get(Q).__webglTexture;e.bindTexture(Mt,ht),v(Mt),e.unbindTexture()}}}function j(y){if(a&&y.samples>0&&K(y)===!1){const M=y.isWebGLMultipleRenderTargets?y.texture:[y.texture],H=y.width,it=y.height;let et=n.COLOR_BUFFER_BIT;const Q=[],Mt=y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ht=i.get(y),gt=y.isWebGLMultipleRenderTargets===!0;if(gt)for(let bt=0;bt<M.length;bt++)e.bindFramebuffer(n.FRAMEBUFFER,ht.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+bt,n.RENDERBUFFER,null),e.bindFramebuffer(n.FRAMEBUFFER,ht.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+bt,n.TEXTURE_2D,null,0);e.bindFramebuffer(n.READ_FRAMEBUFFER,ht.__webglMultisampledFramebuffer),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,ht.__webglFramebuffer);for(let bt=0;bt<M.length;bt++){Q.push(n.COLOR_ATTACHMENT0+bt),y.depthBuffer&&Q.push(Mt);const Ft=ht.__ignoreDepthValues!==void 0?ht.__ignoreDepthValues:!1;if(Ft===!1&&(y.depthBuffer&&(et|=n.DEPTH_BUFFER_BIT),y.stencilBuffer&&(et|=n.STENCIL_BUFFER_BIT)),gt&&n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,ht.__webglColorRenderbuffer[bt]),Ft===!0&&(n.invalidateFramebuffer(n.READ_FRAMEBUFFER,[Mt]),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[Mt])),gt){const nt=i.get(M[bt]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,nt,0)}n.blitFramebuffer(0,0,H,it,0,0,H,it,et,n.NEAREST),l&&n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Q)}if(e.bindFramebuffer(n.READ_FRAMEBUFFER,null),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),gt)for(let bt=0;bt<M.length;bt++){e.bindFramebuffer(n.FRAMEBUFFER,ht.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+bt,n.RENDERBUFFER,ht.__webglColorRenderbuffer[bt]);const Ft=i.get(M[bt]).__webglTexture;e.bindFramebuffer(n.FRAMEBUFFER,ht.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+bt,n.TEXTURE_2D,Ft,0)}e.bindFramebuffer(n.DRAW_FRAMEBUFFER,ht.__webglMultisampledFramebuffer)}}function rt(y){return Math.min(r.maxSamples,y.samples)}function K(y){const M=i.get(y);return a&&y.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function Tt(y){const M=o.render.frame;h.get(y)!==M&&(h.set(y,M),y.update())}function pt(y,M){const H=y.colorSpace,it=y.format,et=y.type;return y.isCompressedTexture===!0||y.isVideoTexture===!0||y.format===ks||H!==on&&H!==qe&&(jt.getTransfer(H)===ie?a===!1?t.has("EXT_sRGB")===!0&&it===tn?(y.format=ks,y.minFilter=Xe,y.generateMipmaps=!1):M=fc.sRGBToLinear(M):(it!==tn||et!==Rn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",H)),M}this.allocateTextureUnit=b,this.resetTextureUnits=z,this.setTexture2D=O,this.setTexture2DArray=q,this.setTexture3D=Z,this.setTextureCube=k,this.rebindTextures=Dt,this.setupRenderTarget=L,this.updateRenderTargetMipmap=ot,this.updateMultisampleRenderTarget=j,this.setupDepthRenderbuffer=yt,this.setupFrameBufferTexture=_t,this.useMultisampledRTT=K}function Zp(n,t,e){const i=e.isWebGL2;function r(s,o=qe){let a;const c=jt.getTransfer(o);if(s===Rn)return n.UNSIGNED_BYTE;if(s===nc)return n.UNSIGNED_SHORT_4_4_4_4;if(s===ic)return n.UNSIGNED_SHORT_5_5_5_1;if(s===Cl)return n.BYTE;if(s===Pl)return n.SHORT;if(s===eo)return n.UNSIGNED_SHORT;if(s===ec)return n.INT;if(s===An)return n.UNSIGNED_INT;if(s===bn)return n.FLOAT;if(s===qi)return i?n.HALF_FLOAT:(a=t.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(s===Ll)return n.ALPHA;if(s===tn)return n.RGBA;if(s===Dl)return n.LUMINANCE;if(s===Ul)return n.LUMINANCE_ALPHA;if(s===Xn)return n.DEPTH_COMPONENT;if(s===yi)return n.DEPTH_STENCIL;if(s===ks)return a=t.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(s===Il)return n.RED;if(s===rc)return n.RED_INTEGER;if(s===Nl)return n.RG;if(s===sc)return n.RG_INTEGER;if(s===oc)return n.RGBA_INTEGER;if(s===es||s===ns||s===is||s===rs)if(c===ie)if(a=t.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(s===es)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(s===ns)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(s===is)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(s===rs)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=t.get("WEBGL_compressed_texture_s3tc"),a!==null){if(s===es)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(s===ns)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(s===is)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(s===rs)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(s===Co||s===Po||s===Lo||s===Do)if(a=t.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(s===Co)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(s===Po)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(s===Lo)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(s===Do)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(s===ac)return a=t.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(s===Uo||s===Io)if(a=t.get("WEBGL_compressed_texture_etc"),a!==null){if(s===Uo)return c===ie?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(s===Io)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(s===No||s===Fo||s===Oo||s===Bo||s===zo||s===Go||s===Ho||s===Vo||s===ko||s===Wo||s===Xo||s===qo||s===Yo||s===Zo)if(a=t.get("WEBGL_compressed_texture_astc"),a!==null){if(s===No)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(s===Fo)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(s===Oo)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(s===Bo)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(s===zo)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(s===Go)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(s===Ho)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(s===Vo)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(s===ko)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(s===Wo)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(s===Xo)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(s===qo)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(s===Yo)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(s===Zo)return c===ie?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(s===ss||s===Jo||s===Ko)if(a=t.get("EXT_texture_compression_bptc"),a!==null){if(s===ss)return c===ie?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(s===Jo)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(s===Ko)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(s===Fl||s===jo||s===$o||s===Qo)if(a=t.get("EXT_texture_compression_rgtc"),a!==null){if(s===ss)return a.COMPRESSED_RED_RGTC1_EXT;if(s===jo)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(s===$o)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(s===Qo)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return s===Wn?i?n.UNSIGNED_INT_24_8:(a=t.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):n[s]!==void 0?n[s]:null}return{convert:r}}class Jp extends Ie{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class Ze extends ye{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Kp={type:"move"};class Ps{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ze,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ze,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ze,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let r=null,s=null,o=null;const a=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){o=!0;for(const g of t.hand.values()){const m=e.getJointPose(g,i),f=this._getHandJoint(l,g);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}const h=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],p=h.position.distanceTo(u.position),d=.02,_=.005;l.inputState.pinching&&p>d+_?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&p<=d-_&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,i),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(r=e.getPose(t.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Kp)))}return a!==null&&(a.visible=r!==null),c!==null&&(c.visible=s!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const i=new Ze;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}}class jp extends bi{constructor(t,e){super();const i=this;let r=null,s=1,o=null,a="local-floor",c=1,l=null,h=null,u=null,p=null,d=null,_=null;const g=e.getContextAttributes();let m=null,f=null;const x=[],v=[],A=new st;let N=null;const w=new Ie;w.layers.enable(1),w.viewport=new re;const R=new Ie;R.layers.enable(2),R.viewport=new re;const C=[w,R],S=new Jp;S.layers.enable(1),S.layers.enable(2);let E=null,D=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let tt=x[Y];return tt===void 0&&(tt=new Ps,x[Y]=tt),tt.getTargetRaySpace()},this.getControllerGrip=function(Y){let tt=x[Y];return tt===void 0&&(tt=new Ps,x[Y]=tt),tt.getGripSpace()},this.getHand=function(Y){let tt=x[Y];return tt===void 0&&(tt=new Ps,x[Y]=tt),tt.getHandSpace()};function B(Y){const tt=v.indexOf(Y.inputSource);if(tt===-1)return;const dt=x[tt];dt!==void 0&&(dt.update(Y.inputSource,Y.frame,l||o),dt.dispatchEvent({type:Y.type,data:Y.inputSource}))}function z(){r.removeEventListener("select",B),r.removeEventListener("selectstart",B),r.removeEventListener("selectend",B),r.removeEventListener("squeeze",B),r.removeEventListener("squeezestart",B),r.removeEventListener("squeezeend",B),r.removeEventListener("end",z),r.removeEventListener("inputsourceschange",b);for(let Y=0;Y<x.length;Y++){const tt=v[Y];tt!==null&&(v[Y]=null,x[Y].disconnect(tt))}E=null,D=null,t.setRenderTarget(m),d=null,p=null,u=null,r=null,f=null,lt.stop(),i.isPresenting=!1,t.setPixelRatio(N),t.setSize(A.width,A.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){s=Y,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){a=Y,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(Y){l=Y},this.getBaseLayer=function(){return p!==null?p:d},this.getBinding=function(){return u},this.getFrame=function(){return _},this.getSession=function(){return r},this.setSession=async function(Y){if(r=Y,r!==null){if(m=t.getRenderTarget(),r.addEventListener("select",B),r.addEventListener("selectstart",B),r.addEventListener("selectend",B),r.addEventListener("squeeze",B),r.addEventListener("squeezestart",B),r.addEventListener("squeezeend",B),r.addEventListener("end",z),r.addEventListener("inputsourceschange",b),g.xrCompatible!==!0&&await e.makeXRCompatible(),N=t.getPixelRatio(),t.getSize(A),r.renderState.layers===void 0||t.capabilities.isWebGL2===!1){const tt={antialias:r.renderState.layers===void 0?g.antialias:!0,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:s};d=new XRWebGLLayer(r,e,tt),r.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),f=new Dn(d.framebufferWidth,d.framebufferHeight,{format:tn,type:Rn,colorSpace:t.outputColorSpace,stencilBuffer:g.stencil})}else{let tt=null,dt=null,St=null;g.depth&&(St=g.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,tt=g.stencil?yi:Xn,dt=g.stencil?Wn:An);const _t={colorFormat:e.RGBA8,depthFormat:St,scaleFactor:s};u=new XRWebGLBinding(r,e),p=u.createProjectionLayer(_t),r.updateRenderState({layers:[p]}),t.setPixelRatio(1),t.setSize(p.textureWidth,p.textureHeight,!1),f=new Dn(p.textureWidth,p.textureHeight,{format:tn,type:Rn,depthTexture:new Ec(p.textureWidth,p.textureHeight,dt,void 0,void 0,void 0,void 0,void 0,void 0,tt),stencilBuffer:g.stencil,colorSpace:t.outputColorSpace,samples:g.antialias?4:0});const Ct=t.properties.get(f);Ct.__ignoreDepthValues=p.ignoreDepthValues}f.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await r.requestReferenceSpace(a),lt.setContext(r),lt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode};function b(Y){for(let tt=0;tt<Y.removed.length;tt++){const dt=Y.removed[tt],St=v.indexOf(dt);St>=0&&(v[St]=null,x[St].disconnect(dt))}for(let tt=0;tt<Y.added.length;tt++){const dt=Y.added[tt];let St=v.indexOf(dt);if(St===-1){for(let Ct=0;Ct<x.length;Ct++)if(Ct>=v.length){v.push(dt),St=Ct;break}else if(v[Ct]===null){v[Ct]=dt,St=Ct;break}if(St===-1)break}const _t=x[St];_t&&_t.connect(dt)}}const U=new P,O=new P;function q(Y,tt,dt){U.setFromMatrixPosition(tt.matrixWorld),O.setFromMatrixPosition(dt.matrixWorld);const St=U.distanceTo(O),_t=tt.projectionMatrix.elements,Ct=dt.projectionMatrix.elements,It=_t[14]/(_t[10]-1),yt=_t[14]/(_t[10]+1),Dt=(_t[9]+1)/_t[5],L=(_t[9]-1)/_t[5],ot=(_t[8]-1)/_t[0],j=(Ct[8]+1)/Ct[0],rt=It*ot,K=It*j,Tt=St/(-ot+j),pt=Tt*-ot;tt.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(pt),Y.translateZ(Tt),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert();const y=It+Tt,M=yt+Tt,H=rt-pt,it=K+(St-pt),et=Dt*yt/M*y,Q=L*yt/M*y;Y.projectionMatrix.makePerspective(H,it,et,Q,y,M),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}function Z(Y,tt){tt===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(tt.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(r===null)return;S.near=R.near=w.near=Y.near,S.far=R.far=w.far=Y.far,(E!==S.near||D!==S.far)&&(r.updateRenderState({depthNear:S.near,depthFar:S.far}),E=S.near,D=S.far);const tt=Y.parent,dt=S.cameras;Z(S,tt);for(let St=0;St<dt.length;St++)Z(dt[St],tt);dt.length===2?q(S,w,R):S.projectionMatrix.copy(w.projectionMatrix),k(Y,S,tt)};function k(Y,tt,dt){dt===null?Y.matrix.copy(tt.matrixWorld):(Y.matrix.copy(dt.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(tt.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(tt.projectionMatrix),Y.projectionMatrixInverse.copy(tt.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=Ws*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(p===null&&d===null))return c},this.setFoveation=function(Y){c=Y,p!==null&&(p.fixedFoveation=Y),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=Y)};let J=null;function $(Y,tt){if(h=tt.getViewerPose(l||o),_=tt,h!==null){const dt=h.views;d!==null&&(t.setRenderTargetFramebuffer(f,d.framebuffer),t.setRenderTarget(f));let St=!1;dt.length!==S.cameras.length&&(S.cameras.length=0,St=!0);for(let _t=0;_t<dt.length;_t++){const Ct=dt[_t];let It=null;if(d!==null)It=d.getViewport(Ct);else{const Dt=u.getViewSubImage(p,Ct);It=Dt.viewport,_t===0&&(t.setRenderTargetTextures(f,Dt.colorTexture,p.ignoreDepthValues?void 0:Dt.depthStencilTexture),t.setRenderTarget(f))}let yt=C[_t];yt===void 0&&(yt=new Ie,yt.layers.enable(_t),yt.viewport=new re,C[_t]=yt),yt.matrix.fromArray(Ct.transform.matrix),yt.matrix.decompose(yt.position,yt.quaternion,yt.scale),yt.projectionMatrix.fromArray(Ct.projectionMatrix),yt.projectionMatrixInverse.copy(yt.projectionMatrix).invert(),yt.viewport.set(It.x,It.y,It.width,It.height),_t===0&&(S.matrix.copy(yt.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),St===!0&&S.cameras.push(yt)}}for(let dt=0;dt<x.length;dt++){const St=v[dt],_t=x[dt];St!==null&&_t!==void 0&&_t.update(St,tt,l||o)}J&&J(Y,tt),tt.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:tt}),_=null}const lt=new yc;lt.setAnimationLoop($),this.setAnimationLoop=function(Y){J=Y},this.dispose=function(){}}}function $p(n,t){function e(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function i(m,f){f.color.getRGB(m.fogColor.value,xc(n)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function r(m,f,x,v,A){f.isMeshBasicMaterial||f.isMeshLambertMaterial?s(m,f):f.isMeshToonMaterial?(s(m,f),u(m,f)):f.isMeshPhongMaterial?(s(m,f),h(m,f)):f.isMeshStandardMaterial?(s(m,f),p(m,f),f.isMeshPhysicalMaterial&&d(m,f,A)):f.isMeshMatcapMaterial?(s(m,f),_(m,f)):f.isMeshDepthMaterial?s(m,f):f.isMeshDistanceMaterial?(s(m,f),g(m,f)):f.isMeshNormalMaterial?s(m,f):f.isLineBasicMaterial?(o(m,f),f.isLineDashedMaterial&&a(m,f)):f.isPointsMaterial?c(m,f,x,v):f.isSpriteMaterial?l(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function s(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,e(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===Le&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,e(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===Le&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,e(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,e(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);const x=t.get(f).envMap;if(x&&(m.envMap.value=x,m.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap){m.lightMap.value=f.lightMap;const v=n._useLegacyLights===!0?Math.PI:1;m.lightMapIntensity.value=f.lightMapIntensity*v,e(f.lightMap,m.lightMapTransform)}f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,m.aoMapTransform))}function o(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform))}function a(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function c(m,f,x,v){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*x,m.scale.value=v*.5,f.map&&(m.map.value=f.map,e(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function l(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function h(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function u(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function p(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,m.roughnessMapTransform)),t.get(f).envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function d(m,f,x){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Le&&m.clearcoatNormalScale.value.negate())),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=x.texture,m.transmissionSamplerSize.value.set(x.width,x.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,m.specularIntensityMapTransform))}function _(m,f){f.matcap&&(m.matcap.value=f.matcap)}function g(m,f){const x=t.get(f).light;m.referencePosition.value.setFromMatrixPosition(x.matrixWorld),m.nearDistance.value=x.shadow.camera.near,m.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function Qp(n,t,e,i){let r={},s={},o=[];const a=e.isWebGL2?n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS):0;function c(x,v){const A=v.program;i.uniformBlockBinding(x,A)}function l(x,v){let A=r[x.id];A===void 0&&(_(x),A=h(x),r[x.id]=A,x.addEventListener("dispose",m));const N=v.program;i.updateUBOMapping(x,N);const w=t.render.frame;s[x.id]!==w&&(p(x),s[x.id]=w)}function h(x){const v=u();x.__bindingPointIndex=v;const A=n.createBuffer(),N=x.__size,w=x.usage;return n.bindBuffer(n.UNIFORM_BUFFER,A),n.bufferData(n.UNIFORM_BUFFER,N,w),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,v,A),A}function u(){for(let x=0;x<a;x++)if(o.indexOf(x)===-1)return o.push(x),x;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function p(x){const v=r[x.id],A=x.uniforms,N=x.__cache;n.bindBuffer(n.UNIFORM_BUFFER,v);for(let w=0,R=A.length;w<R;w++){const C=Array.isArray(A[w])?A[w]:[A[w]];for(let S=0,E=C.length;S<E;S++){const D=C[S];if(d(D,w,S,N)===!0){const B=D.__offset,z=Array.isArray(D.value)?D.value:[D.value];let b=0;for(let U=0;U<z.length;U++){const O=z[U],q=g(O);typeof O=="number"||typeof O=="boolean"?(D.__data[0]=O,n.bufferSubData(n.UNIFORM_BUFFER,B+b,D.__data)):O.isMatrix3?(D.__data[0]=O.elements[0],D.__data[1]=O.elements[1],D.__data[2]=O.elements[2],D.__data[3]=0,D.__data[4]=O.elements[3],D.__data[5]=O.elements[4],D.__data[6]=O.elements[5],D.__data[7]=0,D.__data[8]=O.elements[6],D.__data[9]=O.elements[7],D.__data[10]=O.elements[8],D.__data[11]=0):(O.toArray(D.__data,b),b+=q.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,B,D.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function d(x,v,A,N){const w=x.value,R=v+"_"+A;if(N[R]===void 0)return typeof w=="number"||typeof w=="boolean"?N[R]=w:N[R]=w.clone(),!0;{const C=N[R];if(typeof w=="number"||typeof w=="boolean"){if(C!==w)return N[R]=w,!0}else if(C.equals(w)===!1)return C.copy(w),!0}return!1}function _(x){const v=x.uniforms;let A=0;const N=16;for(let R=0,C=v.length;R<C;R++){const S=Array.isArray(v[R])?v[R]:[v[R]];for(let E=0,D=S.length;E<D;E++){const B=S[E],z=Array.isArray(B.value)?B.value:[B.value];for(let b=0,U=z.length;b<U;b++){const O=z[b],q=g(O),Z=A%N;Z!==0&&N-Z<q.boundary&&(A+=N-Z),B.__data=new Float32Array(q.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=A,A+=q.storage}}}const w=A%N;return w>0&&(A+=N-w),x.__size=A,x.__cache={},this}function g(x){const v={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(v.boundary=4,v.storage=4):x.isVector2?(v.boundary=8,v.storage=8):x.isVector3||x.isColor?(v.boundary=16,v.storage=12):x.isVector4?(v.boundary=16,v.storage=16):x.isMatrix3?(v.boundary=48,v.storage=48):x.isMatrix4?(v.boundary=64,v.storage=64):x.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",x),v}function m(x){const v=x.target;v.removeEventListener("dispose",m);const A=o.indexOf(v.__bindingPointIndex);o.splice(A,1),n.deleteBuffer(r[v.id]),delete r[v.id],delete s[v.id]}function f(){for(const x in r)n.deleteBuffer(r[x]);o=[],r={},s={}}return{bind:c,update:l,dispose:f}}class Xr{constructor(t={}){const{canvas:e=Zl(),context:i=null,depth:r=!0,stencil:s=!0,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=t;this.isWebGLRenderer=!0;let p;i!==null?p=i.getContextAttributes().alpha:p=o;const d=new Uint32Array(4),_=new Int32Array(4);let g=null,m=null;const f=[],x=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=he,this._useLegacyLights=!1,this.toneMapping=gn,this.toneMappingExposure=1;const v=this;let A=!1,N=0,w=0,R=null,C=-1,S=null;const E=new re,D=new re;let B=null;const z=new Yt(0);let b=0,U=e.width,O=e.height,q=1,Z=null,k=null;const J=new re(0,0,U,O),$=new re(0,0,U,O);let lt=!1;const Y=new so;let tt=!1,dt=!1,St=null;const _t=new ue,Ct=new st,It=new P,yt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Dt(){return R===null?q:1}let L=i;function ot(T,G){for(let W=0;W<T.length;W++){const X=T[W],V=e.getContext(X,G);if(V!==null)return V}return null}try{const T={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${to}`),e.addEventListener("webglcontextlost",at,!1),e.addEventListener("webglcontextrestored",F,!1),e.addEventListener("webglcontextcreationerror",ut,!1),L===null){const G=["webgl2","webgl","experimental-webgl"];if(v.isWebGL1Renderer===!0&&G.shift(),L=ot(G,T),L===null)throw ot(G)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&L instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),L.getShaderPrecisionFormat===void 0&&(L.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(T){throw console.error("THREE.WebGLRenderer: "+T.message),T}let j,rt,K,Tt,pt,y,M,H,it,et,Q,Mt,ht,gt,bt,Ft,nt,Jt,Xt,Ut,At,xt,Bt,Kt;function ae(){j=new ld(L),rt=new id(L,j,t),j.init(rt),xt=new Zp(L,j,rt),K=new qp(L,j,rt),Tt=new fd(L),pt=new Dp,y=new Yp(L,j,K,pt,rt,xt,Tt),M=new sd(v),H=new cd(v),it=new xh(L,rt),Bt=new ed(L,j,it,rt),et=new hd(L,it,Tt,Bt),Q=new _d(L,et,it,Tt),Xt=new md(L,rt,y),Ft=new rd(pt),Mt=new Lp(v,M,H,j,rt,Bt,Ft),ht=new $p(v,pt),gt=new Ip,bt=new Gp(j,rt),Jt=new td(v,M,H,K,Q,p,c),nt=new Xp(v,Q,rt),Kt=new Qp(L,Tt,rt,K),Ut=new nd(L,j,Tt,rt),At=new ud(L,j,Tt,rt),Tt.programs=Mt.programs,v.capabilities=rt,v.extensions=j,v.properties=pt,v.renderLists=gt,v.shadowMap=nt,v.state=K,v.info=Tt}ae();const Vt=new jp(v,L);this.xr=Vt,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){const T=j.get("WEBGL_lose_context");T&&T.loseContext()},this.forceContextRestore=function(){const T=j.get("WEBGL_lose_context");T&&T.restoreContext()},this.getPixelRatio=function(){return q},this.setPixelRatio=function(T){T!==void 0&&(q=T,this.setSize(U,O,!1))},this.getSize=function(T){return T.set(U,O)},this.setSize=function(T,G,W=!0){if(Vt.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}U=T,O=G,e.width=Math.floor(T*q),e.height=Math.floor(G*q),W===!0&&(e.style.width=T+"px",e.style.height=G+"px"),this.setViewport(0,0,T,G)},this.getDrawingBufferSize=function(T){return T.set(U*q,O*q).floor()},this.setDrawingBufferSize=function(T,G,W){U=T,O=G,q=W,e.width=Math.floor(T*W),e.height=Math.floor(G*W),this.setViewport(0,0,T,G)},this.getCurrentViewport=function(T){return T.copy(E)},this.getViewport=function(T){return T.copy(J)},this.setViewport=function(T,G,W,X){T.isVector4?J.set(T.x,T.y,T.z,T.w):J.set(T,G,W,X),K.viewport(E.copy(J).multiplyScalar(q).floor())},this.getScissor=function(T){return T.copy($)},this.setScissor=function(T,G,W,X){T.isVector4?$.set(T.x,T.y,T.z,T.w):$.set(T,G,W,X),K.scissor(D.copy($).multiplyScalar(q).floor())},this.getScissorTest=function(){return lt},this.setScissorTest=function(T){K.setScissorTest(lt=T)},this.setOpaqueSort=function(T){Z=T},this.setTransparentSort=function(T){k=T},this.getClearColor=function(T){return T.copy(Jt.getClearColor())},this.setClearColor=function(){Jt.setClearColor.apply(Jt,arguments)},this.getClearAlpha=function(){return Jt.getClearAlpha()},this.setClearAlpha=function(){Jt.setClearAlpha.apply(Jt,arguments)},this.clear=function(T=!0,G=!0,W=!0){let X=0;if(T){let V=!1;if(R!==null){const mt=R.texture.format;V=mt===oc||mt===sc||mt===rc}if(V){const mt=R.texture.type,Et=mt===Rn||mt===An||mt===eo||mt===Wn||mt===nc||mt===ic,Rt=Jt.getClearColor(),Lt=Jt.getClearAlpha(),Ht=Rt.r,Nt=Rt.g,Ot=Rt.b;Et?(d[0]=Ht,d[1]=Nt,d[2]=Ot,d[3]=Lt,L.clearBufferuiv(L.COLOR,0,d)):(_[0]=Ht,_[1]=Nt,_[2]=Ot,_[3]=Lt,L.clearBufferiv(L.COLOR,0,_))}else X|=L.COLOR_BUFFER_BIT}G&&(X|=L.DEPTH_BUFFER_BIT),W&&(X|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),L.clear(X)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",at,!1),e.removeEventListener("webglcontextrestored",F,!1),e.removeEventListener("webglcontextcreationerror",ut,!1),gt.dispose(),bt.dispose(),pt.dispose(),M.dispose(),H.dispose(),Q.dispose(),Bt.dispose(),Kt.dispose(),Mt.dispose(),Vt.dispose(),Vt.removeEventListener("sessionstart",be),Vt.removeEventListener("sessionend",ne),St&&(St.dispose(),St=null),we.stop()};function at(T){T.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),A=!0}function F(){console.log("THREE.WebGLRenderer: Context Restored."),A=!1;const T=Tt.autoReset,G=nt.enabled,W=nt.autoUpdate,X=nt.needsUpdate,V=nt.type;ae(),Tt.autoReset=T,nt.enabled=G,nt.autoUpdate=W,nt.needsUpdate=X,nt.type=V}function ut(T){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",T.statusMessage)}function ft(T){const G=T.target;G.removeEventListener("dispose",ft),Pt(G)}function Pt(T){wt(T),pt.remove(T)}function wt(T){const G=pt.get(T).programs;G!==void 0&&(G.forEach(function(W){Mt.releaseProgram(W)}),T.isShaderMaterial&&Mt.releaseShaderCache(T))}this.renderBufferDirect=function(T,G,W,X,V,mt){G===null&&(G=yt);const Et=V.isMesh&&V.matrixWorld.determinant()<0,Rt=qc(T,G,W,X,V);K.setMaterial(X,Et);let Lt=W.index,Ht=1;if(X.wireframe===!0){if(Lt=et.getWireframeAttribute(W),Lt===void 0)return;Ht=2}const Nt=W.drawRange,Ot=W.attributes.position;let le=Nt.start*Ht,Ge=(Nt.start+Nt.count)*Ht;mt!==null&&(le=Math.max(le,mt.start*Ht),Ge=Math.min(Ge,(mt.start+mt.count)*Ht)),Lt!==null?(le=Math.max(le,0),Ge=Math.min(Ge,Lt.count)):Ot!=null&&(le=Math.max(le,0),Ge=Math.min(Ge,Ot.count));const _e=Ge-le;if(_e<0||_e===1/0)return;Bt.setup(V,X,Rt,W,Lt);let cn,se=Ut;if(Lt!==null&&(cn=it.get(Lt),se=At,se.setIndex(cn)),V.isMesh)X.wireframe===!0?(K.setLineWidth(X.wireframeLinewidth*Dt()),se.setMode(L.LINES)):se.setMode(L.TRIANGLES);else if(V.isLine){let kt=X.linewidth;kt===void 0&&(kt=1),K.setLineWidth(kt*Dt()),V.isLineSegments?se.setMode(L.LINES):V.isLineLoop?se.setMode(L.LINE_LOOP):se.setMode(L.LINE_STRIP)}else V.isPoints?se.setMode(L.POINTS):V.isSprite&&se.setMode(L.TRIANGLES);if(V.isBatchedMesh)se.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else if(V.isInstancedMesh)se.renderInstances(le,_e,V.count);else if(W.isInstancedBufferGeometry){const kt=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,Kr=Math.min(W.instanceCount,kt);se.renderInstances(le,_e,Kr)}else se.render(le,_e)};function te(T,G,W){T.transparent===!0&&T.side===Ne&&T.forceSinglePass===!1?(T.side=Le,T.needsUpdate=!0,nr(T,G,W),T.side=Ln,T.needsUpdate=!0,nr(T,G,W),T.side=Ne):nr(T,G,W)}this.compile=function(T,G,W=null){W===null&&(W=T),m=bt.get(W),m.init(),x.push(m),W.traverseVisible(function(V){V.isLight&&V.layers.test(G.layers)&&(m.pushLight(V),V.castShadow&&m.pushShadow(V))}),T!==W&&T.traverseVisible(function(V){V.isLight&&V.layers.test(G.layers)&&(m.pushLight(V),V.castShadow&&m.pushShadow(V))}),m.setupLights(v._useLegacyLights);const X=new Set;return T.traverse(function(V){const mt=V.material;if(mt)if(Array.isArray(mt))for(let Et=0;Et<mt.length;Et++){const Rt=mt[Et];te(Rt,W,V),X.add(Rt)}else te(mt,W,V),X.add(mt)}),x.pop(),m=null,X},this.compileAsync=function(T,G,W=null){const X=this.compile(T,G,W);return new Promise(V=>{function mt(){if(X.forEach(function(Et){pt.get(Et).currentProgram.isReady()&&X.delete(Et)}),X.size===0){V(T);return}setTimeout(mt,10)}j.get("KHR_parallel_shader_compile")!==null?mt():setTimeout(mt,10)})};let ee=null;function me(T){ee&&ee(T)}function be(){we.stop()}function ne(){we.start()}const we=new yc;we.setAnimationLoop(me),typeof self<"u"&&we.setContext(self),this.setAnimationLoop=function(T){ee=T,Vt.setAnimationLoop(T),T===null?we.stop():we.start()},Vt.addEventListener("sessionstart",be),Vt.addEventListener("sessionend",ne),this.render=function(T,G){if(G!==void 0&&G.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(A===!0)return;T.matrixWorldAutoUpdate===!0&&T.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),Vt.enabled===!0&&Vt.isPresenting===!0&&(Vt.cameraAutoUpdate===!0&&Vt.updateCamera(G),G=Vt.getCamera()),T.isScene===!0&&T.onBeforeRender(v,T,G,R),m=bt.get(T,x.length),m.init(),x.push(m),_t.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),Y.setFromProjectionMatrix(_t),dt=this.localClippingEnabled,tt=Ft.init(this.clippingPlanes,dt),g=gt.get(T,f.length),g.init(),f.push(g),nn(T,G,0,v.sortObjects),g.finish(),v.sortObjects===!0&&g.sort(Z,k),this.info.render.frame++,tt===!0&&Ft.beginShadows();const W=m.state.shadowsArray;if(nt.render(W,T,G),tt===!0&&Ft.endShadows(),this.info.autoReset===!0&&this.info.reset(),Jt.render(g,T),m.setupLights(v._useLegacyLights),G.isArrayCamera){const X=G.cameras;for(let V=0,mt=X.length;V<mt;V++){const Et=X[V];_o(g,T,Et,Et.viewport)}}else _o(g,T,G);R!==null&&(y.updateMultisampleRenderTarget(R),y.updateRenderTargetMipmap(R)),T.isScene===!0&&T.onAfterRender(v,T,G),Bt.resetDefaultState(),C=-1,S=null,x.pop(),x.length>0?m=x[x.length-1]:m=null,f.pop(),f.length>0?g=f[f.length-1]:g=null};function nn(T,G,W,X){if(T.visible===!1)return;if(T.layers.test(G.layers)){if(T.isGroup)W=T.renderOrder;else if(T.isLOD)T.autoUpdate===!0&&T.update(G);else if(T.isLight)m.pushLight(T),T.castShadow&&m.pushShadow(T);else if(T.isSprite){if(!T.frustumCulled||Y.intersectsSprite(T)){X&&It.setFromMatrixPosition(T.matrixWorld).applyMatrix4(_t);const Et=Q.update(T),Rt=T.material;Rt.visible&&g.push(T,Et,Rt,W,It.z,null)}}else if((T.isMesh||T.isLine||T.isPoints)&&(!T.frustumCulled||Y.intersectsObject(T))){const Et=Q.update(T),Rt=T.material;if(X&&(T.boundingSphere!==void 0?(T.boundingSphere===null&&T.computeBoundingSphere(),It.copy(T.boundingSphere.center)):(Et.boundingSphere===null&&Et.computeBoundingSphere(),It.copy(Et.boundingSphere.center)),It.applyMatrix4(T.matrixWorld).applyMatrix4(_t)),Array.isArray(Rt)){const Lt=Et.groups;for(let Ht=0,Nt=Lt.length;Ht<Nt;Ht++){const Ot=Lt[Ht],le=Rt[Ot.materialIndex];le&&le.visible&&g.push(T,Et,le,W,It.z,Ot)}}else Rt.visible&&g.push(T,Et,Rt,W,It.z,null)}}const mt=T.children;for(let Et=0,Rt=mt.length;Et<Rt;Et++)nn(mt[Et],G,W,X)}function _o(T,G,W,X){const V=T.opaque,mt=T.transmissive,Et=T.transparent;m.setupLightsView(W),tt===!0&&Ft.setGlobalState(v.clippingPlanes,W),mt.length>0&&Xc(V,mt,G,W),X&&K.viewport(E.copy(X)),V.length>0&&er(V,G,W),mt.length>0&&er(mt,G,W),Et.length>0&&er(Et,G,W),K.buffers.depth.setTest(!0),K.buffers.depth.setMask(!0),K.buffers.color.setMask(!0),K.setPolygonOffset(!1)}function Xc(T,G,W,X){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;const mt=rt.isWebGL2;St===null&&(St=new Dn(1,1,{generateMipmaps:!0,type:j.has("EXT_color_buffer_half_float")?qi:Rn,minFilter:Xi,samples:mt?4:0})),v.getDrawingBufferSize(Ct),mt?St.setSize(Ct.x,Ct.y):St.setSize(Xs(Ct.x),Xs(Ct.y));const Et=v.getRenderTarget();v.setRenderTarget(St),v.getClearColor(z),b=v.getClearAlpha(),b<1&&v.setClearColor(16777215,.5),v.clear();const Rt=v.toneMapping;v.toneMapping=gn,er(T,W,X),y.updateMultisampleRenderTarget(St),y.updateRenderTargetMipmap(St);let Lt=!1;for(let Ht=0,Nt=G.length;Ht<Nt;Ht++){const Ot=G[Ht],le=Ot.object,Ge=Ot.geometry,_e=Ot.material,cn=Ot.group;if(_e.side===Ne&&le.layers.test(X.layers)){const se=_e.side;_e.side=Le,_e.needsUpdate=!0,go(le,W,X,Ge,_e,cn),_e.side=se,_e.needsUpdate=!0,Lt=!0}}Lt===!0&&(y.updateMultisampleRenderTarget(St),y.updateRenderTargetMipmap(St)),v.setRenderTarget(Et),v.setClearColor(z,b),v.toneMapping=Rt}function er(T,G,W){const X=G.isScene===!0?G.overrideMaterial:null;for(let V=0,mt=T.length;V<mt;V++){const Et=T[V],Rt=Et.object,Lt=Et.geometry,Ht=X===null?Et.material:X,Nt=Et.group;Rt.layers.test(W.layers)&&go(Rt,G,W,Lt,Ht,Nt)}}function go(T,G,W,X,V,mt){T.onBeforeRender(v,G,W,X,V,mt),T.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,T.matrixWorld),T.normalMatrix.getNormalMatrix(T.modelViewMatrix),V.onBeforeRender(v,G,W,X,T,mt),V.transparent===!0&&V.side===Ne&&V.forceSinglePass===!1?(V.side=Le,V.needsUpdate=!0,v.renderBufferDirect(W,G,X,V,T,mt),V.side=Ln,V.needsUpdate=!0,v.renderBufferDirect(W,G,X,V,T,mt),V.side=Ne):v.renderBufferDirect(W,G,X,V,T,mt),T.onAfterRender(v,G,W,X,V,mt)}function nr(T,G,W){G.isScene!==!0&&(G=yt);const X=pt.get(T),V=m.state.lights,mt=m.state.shadowsArray,Et=V.state.version,Rt=Mt.getParameters(T,V.state,mt,G,W),Lt=Mt.getProgramCacheKey(Rt);let Ht=X.programs;X.environment=T.isMeshStandardMaterial?G.environment:null,X.fog=G.fog,X.envMap=(T.isMeshStandardMaterial?H:M).get(T.envMap||X.environment),Ht===void 0&&(T.addEventListener("dispose",ft),Ht=new Map,X.programs=Ht);let Nt=Ht.get(Lt);if(Nt!==void 0){if(X.currentProgram===Nt&&X.lightsStateVersion===Et)return xo(T,Rt),Nt}else Rt.uniforms=Mt.getUniforms(T),T.onBuild(W,Rt,v),T.onBeforeCompile(Rt,v),Nt=Mt.acquireProgram(Rt,Lt),Ht.set(Lt,Nt),X.uniforms=Rt.uniforms;const Ot=X.uniforms;return(!T.isShaderMaterial&&!T.isRawShaderMaterial||T.clipping===!0)&&(Ot.clippingPlanes=Ft.uniform),xo(T,Rt),X.needsLights=Zc(T),X.lightsStateVersion=Et,X.needsLights&&(Ot.ambientLightColor.value=V.state.ambient,Ot.lightProbe.value=V.state.probe,Ot.directionalLights.value=V.state.directional,Ot.directionalLightShadows.value=V.state.directionalShadow,Ot.spotLights.value=V.state.spot,Ot.spotLightShadows.value=V.state.spotShadow,Ot.rectAreaLights.value=V.state.rectArea,Ot.ltc_1.value=V.state.rectAreaLTC1,Ot.ltc_2.value=V.state.rectAreaLTC2,Ot.pointLights.value=V.state.point,Ot.pointLightShadows.value=V.state.pointShadow,Ot.hemisphereLights.value=V.state.hemi,Ot.directionalShadowMap.value=V.state.directionalShadowMap,Ot.directionalShadowMatrix.value=V.state.directionalShadowMatrix,Ot.spotShadowMap.value=V.state.spotShadowMap,Ot.spotLightMatrix.value=V.state.spotLightMatrix,Ot.spotLightMap.value=V.state.spotLightMap,Ot.pointShadowMap.value=V.state.pointShadowMap,Ot.pointShadowMatrix.value=V.state.pointShadowMatrix),X.currentProgram=Nt,X.uniformsList=null,Nt}function vo(T){if(T.uniformsList===null){const G=T.currentProgram.getUniforms();T.uniformsList=Rr.seqWithValue(G.seq,T.uniforms)}return T.uniformsList}function xo(T,G){const W=pt.get(T);W.outputColorSpace=G.outputColorSpace,W.batching=G.batching,W.instancing=G.instancing,W.instancingColor=G.instancingColor,W.skinning=G.skinning,W.morphTargets=G.morphTargets,W.morphNormals=G.morphNormals,W.morphColors=G.morphColors,W.morphTargetsCount=G.morphTargetsCount,W.numClippingPlanes=G.numClippingPlanes,W.numIntersection=G.numClipIntersection,W.vertexAlphas=G.vertexAlphas,W.vertexTangents=G.vertexTangents,W.toneMapping=G.toneMapping}function qc(T,G,W,X,V){G.isScene!==!0&&(G=yt),y.resetTextureUnits();const mt=G.fog,Et=X.isMeshStandardMaterial?G.environment:null,Rt=R===null?v.outputColorSpace:R.isXRRenderTarget===!0?R.texture.colorSpace:on,Lt=(X.isMeshStandardMaterial?H:M).get(X.envMap||Et),Ht=X.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Nt=!!W.attributes.tangent&&(!!X.normalMap||X.anisotropy>0),Ot=!!W.morphAttributes.position,le=!!W.morphAttributes.normal,Ge=!!W.morphAttributes.color;let _e=gn;X.toneMapped&&(R===null||R.isXRRenderTarget===!0)&&(_e=v.toneMapping);const cn=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,se=cn!==void 0?cn.length:0,kt=pt.get(X),Kr=m.state.lights;if(tt===!0&&(dt===!0||T!==S)){const ke=T===S&&X.id===C;Ft.setState(X,T,ke)}let ce=!1;X.version===kt.__version?(kt.needsLights&&kt.lightsStateVersion!==Kr.state.version||kt.outputColorSpace!==Rt||V.isBatchedMesh&&kt.batching===!1||!V.isBatchedMesh&&kt.batching===!0||V.isInstancedMesh&&kt.instancing===!1||!V.isInstancedMesh&&kt.instancing===!0||V.isSkinnedMesh&&kt.skinning===!1||!V.isSkinnedMesh&&kt.skinning===!0||V.isInstancedMesh&&kt.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&kt.instancingColor===!1&&V.instanceColor!==null||kt.envMap!==Lt||X.fog===!0&&kt.fog!==mt||kt.numClippingPlanes!==void 0&&(kt.numClippingPlanes!==Ft.numPlanes||kt.numIntersection!==Ft.numIntersection)||kt.vertexAlphas!==Ht||kt.vertexTangents!==Nt||kt.morphTargets!==Ot||kt.morphNormals!==le||kt.morphColors!==Ge||kt.toneMapping!==_e||rt.isWebGL2===!0&&kt.morphTargetsCount!==se)&&(ce=!0):(ce=!0,kt.__version=X.version);let In=kt.currentProgram;ce===!0&&(In=nr(X,G,V));let Mo=!1,Di=!1,jr=!1;const Ee=In.getUniforms(),Nn=kt.uniforms;if(K.useProgram(In.program)&&(Mo=!0,Di=!0,jr=!0),X.id!==C&&(C=X.id,Di=!0),Mo||S!==T){Ee.setValue(L,"projectionMatrix",T.projectionMatrix),Ee.setValue(L,"viewMatrix",T.matrixWorldInverse);const ke=Ee.map.cameraPosition;ke!==void 0&&ke.setValue(L,It.setFromMatrixPosition(T.matrixWorld)),rt.logarithmicDepthBuffer&&Ee.setValue(L,"logDepthBufFC",2/(Math.log(T.far+1)/Math.LN2)),(X.isMeshPhongMaterial||X.isMeshToonMaterial||X.isMeshLambertMaterial||X.isMeshBasicMaterial||X.isMeshStandardMaterial||X.isShaderMaterial)&&Ee.setValue(L,"isOrthographic",T.isOrthographicCamera===!0),S!==T&&(S=T,Di=!0,jr=!0)}if(V.isSkinnedMesh){Ee.setOptional(L,V,"bindMatrix"),Ee.setOptional(L,V,"bindMatrixInverse");const ke=V.skeleton;ke&&(rt.floatVertexTextures?(ke.boneTexture===null&&ke.computeBoneTexture(),Ee.setValue(L,"boneTexture",ke.boneTexture,y)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}V.isBatchedMesh&&(Ee.setOptional(L,V,"batchingTexture"),Ee.setValue(L,"batchingTexture",V._matricesTexture,y));const $r=W.morphAttributes;if(($r.position!==void 0||$r.normal!==void 0||$r.color!==void 0&&rt.isWebGL2===!0)&&Xt.update(V,W,In),(Di||kt.receiveShadow!==V.receiveShadow)&&(kt.receiveShadow=V.receiveShadow,Ee.setValue(L,"receiveShadow",V.receiveShadow)),X.isMeshGouraudMaterial&&X.envMap!==null&&(Nn.envMap.value=Lt,Nn.flipEnvMap.value=Lt.isCubeTexture&&Lt.isRenderTargetTexture===!1?-1:1),Di&&(Ee.setValue(L,"toneMappingExposure",v.toneMappingExposure),kt.needsLights&&Yc(Nn,jr),mt&&X.fog===!0&&ht.refreshFogUniforms(Nn,mt),ht.refreshMaterialUniforms(Nn,X,q,O,St),Rr.upload(L,vo(kt),Nn,y)),X.isShaderMaterial&&X.uniformsNeedUpdate===!0&&(Rr.upload(L,vo(kt),Nn,y),X.uniformsNeedUpdate=!1),X.isSpriteMaterial&&Ee.setValue(L,"center",V.center),Ee.setValue(L,"modelViewMatrix",V.modelViewMatrix),Ee.setValue(L,"normalMatrix",V.normalMatrix),Ee.setValue(L,"modelMatrix",V.matrixWorld),X.isShaderMaterial||X.isRawShaderMaterial){const ke=X.uniformsGroups;for(let Qr=0,Jc=ke.length;Qr<Jc;Qr++)if(rt.isWebGL2){const So=ke[Qr];Kt.update(So,In),Kt.bind(So,In)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return In}function Yc(T,G){T.ambientLightColor.needsUpdate=G,T.lightProbe.needsUpdate=G,T.directionalLights.needsUpdate=G,T.directionalLightShadows.needsUpdate=G,T.pointLights.needsUpdate=G,T.pointLightShadows.needsUpdate=G,T.spotLights.needsUpdate=G,T.spotLightShadows.needsUpdate=G,T.rectAreaLights.needsUpdate=G,T.hemisphereLights.needsUpdate=G}function Zc(T){return T.isMeshLambertMaterial||T.isMeshToonMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isShadowMaterial||T.isShaderMaterial&&T.lights===!0}this.getActiveCubeFace=function(){return N},this.getActiveMipmapLevel=function(){return w},this.getRenderTarget=function(){return R},this.setRenderTargetTextures=function(T,G,W){pt.get(T.texture).__webglTexture=G,pt.get(T.depthTexture).__webglTexture=W;const X=pt.get(T);X.__hasExternalTextures=!0,X.__hasExternalTextures&&(X.__autoAllocateDepthBuffer=W===void 0,X.__autoAllocateDepthBuffer||j.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),X.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(T,G){const W=pt.get(T);W.__webglFramebuffer=G,W.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(T,G=0,W=0){R=T,N=G,w=W;let X=!0,V=null,mt=!1,Et=!1;if(T){const Lt=pt.get(T);Lt.__useDefaultFramebuffer!==void 0?(K.bindFramebuffer(L.FRAMEBUFFER,null),X=!1):Lt.__webglFramebuffer===void 0?y.setupRenderTarget(T):Lt.__hasExternalTextures&&y.rebindTextures(T,pt.get(T.texture).__webglTexture,pt.get(T.depthTexture).__webglTexture);const Ht=T.texture;(Ht.isData3DTexture||Ht.isDataArrayTexture||Ht.isCompressedArrayTexture)&&(Et=!0);const Nt=pt.get(T).__webglFramebuffer;T.isWebGLCubeRenderTarget?(Array.isArray(Nt[G])?V=Nt[G][W]:V=Nt[G],mt=!0):rt.isWebGL2&&T.samples>0&&y.useMultisampledRTT(T)===!1?V=pt.get(T).__webglMultisampledFramebuffer:Array.isArray(Nt)?V=Nt[W]:V=Nt,E.copy(T.viewport),D.copy(T.scissor),B=T.scissorTest}else E.copy(J).multiplyScalar(q).floor(),D.copy($).multiplyScalar(q).floor(),B=lt;if(K.bindFramebuffer(L.FRAMEBUFFER,V)&&rt.drawBuffers&&X&&K.drawBuffers(T,V),K.viewport(E),K.scissor(D),K.setScissorTest(B),mt){const Lt=pt.get(T.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+G,Lt.__webglTexture,W)}else if(Et){const Lt=pt.get(T.texture),Ht=G||0;L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,Lt.__webglTexture,W||0,Ht)}C=-1},this.readRenderTargetPixels=function(T,G,W,X,V,mt,Et){if(!(T&&T.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Rt=pt.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&Et!==void 0&&(Rt=Rt[Et]),Rt){K.bindFramebuffer(L.FRAMEBUFFER,Rt);try{const Lt=T.texture,Ht=Lt.format,Nt=Lt.type;if(Ht!==tn&&xt.convert(Ht)!==L.getParameter(L.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Ot=Nt===qi&&(j.has("EXT_color_buffer_half_float")||rt.isWebGL2&&j.has("EXT_color_buffer_float"));if(Nt!==Rn&&xt.convert(Nt)!==L.getParameter(L.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Nt===bn&&(rt.isWebGL2||j.has("OES_texture_float")||j.has("WEBGL_color_buffer_float")))&&!Ot){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=T.width-X&&W>=0&&W<=T.height-V&&L.readPixels(G,W,X,V,xt.convert(Ht),xt.convert(Nt),mt)}finally{const Lt=R!==null?pt.get(R).__webglFramebuffer:null;K.bindFramebuffer(L.FRAMEBUFFER,Lt)}}},this.copyFramebufferToTexture=function(T,G,W=0){const X=Math.pow(2,-W),V=Math.floor(G.image.width*X),mt=Math.floor(G.image.height*X);y.setTexture2D(G,0),L.copyTexSubImage2D(L.TEXTURE_2D,W,0,0,T.x,T.y,V,mt),K.unbindTexture()},this.copyTextureToTexture=function(T,G,W,X=0){const V=G.image.width,mt=G.image.height,Et=xt.convert(W.format),Rt=xt.convert(W.type);y.setTexture2D(W,0),L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,W.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,W.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,W.unpackAlignment),G.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,X,T.x,T.y,V,mt,Et,Rt,G.image.data):G.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,X,T.x,T.y,G.mipmaps[0].width,G.mipmaps[0].height,Et,G.mipmaps[0].data):L.texSubImage2D(L.TEXTURE_2D,X,T.x,T.y,Et,Rt,G.image),X===0&&W.generateMipmaps&&L.generateMipmap(L.TEXTURE_2D),K.unbindTexture()},this.copyTextureToTexture3D=function(T,G,W,X,V=0){if(v.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const mt=T.max.x-T.min.x+1,Et=T.max.y-T.min.y+1,Rt=T.max.z-T.min.z+1,Lt=xt.convert(X.format),Ht=xt.convert(X.type);let Nt;if(X.isData3DTexture)y.setTexture3D(X,0),Nt=L.TEXTURE_3D;else if(X.isDataArrayTexture||X.isCompressedArrayTexture)y.setTexture2DArray(X,0),Nt=L.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,X.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,X.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,X.unpackAlignment);const Ot=L.getParameter(L.UNPACK_ROW_LENGTH),le=L.getParameter(L.UNPACK_IMAGE_HEIGHT),Ge=L.getParameter(L.UNPACK_SKIP_PIXELS),_e=L.getParameter(L.UNPACK_SKIP_ROWS),cn=L.getParameter(L.UNPACK_SKIP_IMAGES),se=W.isCompressedTexture?W.mipmaps[V]:W.image;L.pixelStorei(L.UNPACK_ROW_LENGTH,se.width),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,se.height),L.pixelStorei(L.UNPACK_SKIP_PIXELS,T.min.x),L.pixelStorei(L.UNPACK_SKIP_ROWS,T.min.y),L.pixelStorei(L.UNPACK_SKIP_IMAGES,T.min.z),W.isDataTexture||W.isData3DTexture?L.texSubImage3D(Nt,V,G.x,G.y,G.z,mt,Et,Rt,Lt,Ht,se.data):W.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),L.compressedTexSubImage3D(Nt,V,G.x,G.y,G.z,mt,Et,Rt,Lt,se.data)):L.texSubImage3D(Nt,V,G.x,G.y,G.z,mt,Et,Rt,Lt,Ht,se),L.pixelStorei(L.UNPACK_ROW_LENGTH,Ot),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,le),L.pixelStorei(L.UNPACK_SKIP_PIXELS,Ge),L.pixelStorei(L.UNPACK_SKIP_ROWS,_e),L.pixelStorei(L.UNPACK_SKIP_IMAGES,cn),V===0&&X.generateMipmaps&&L.generateMipmap(Nt),K.unbindTexture()},this.initTexture=function(T){T.isCubeTexture?y.setTextureCube(T,0):T.isData3DTexture?y.setTexture3D(T,0):T.isDataArrayTexture||T.isCompressedArrayTexture?y.setTexture2DArray(T,0):y.setTexture2D(T,0),K.unbindTexture()},this.resetState=function(){N=0,w=0,R=null,K.reset(),Bt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return _n}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===no?"display-p3":"srgb",e.unpackColorSpace=jt.workingColorSpace===Hr?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===he?qn:cc}set outputEncoding(t){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=t===qn?he:on}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(t){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=t}}class tm extends Xr{}tm.prototype.isWebGL1Renderer=!0;class Ha extends ye{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e}}class em extends Fe{constructor(t,e,i,r,s,o,a,c,l){super(t,e,i,r,s,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class an{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const i=this.getUtoTmapping(t);return this.getPoint(i,e)}getPoints(t=5){const e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return e}getSpacedPoints(t=5){const e=[];for(let i=0;i<=t;i++)e.push(this.getPointAt(i/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let i,r=this.getPoint(0),s=0;e.push(0);for(let o=1;o<=t;o++)i=this.getPoint(o/t),s+=i.distanceTo(r),e.push(s),r=i;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const i=this.getLengths();let r=0;const s=i.length;let o;e?o=e:o=t*i[s-1];let a=0,c=s-1,l;for(;a<=c;)if(r=Math.floor(a+(c-a)/2),l=i[r]-o,l<0)a=r+1;else if(l>0)c=r-1;else{c=r;break}if(r=c,i[r]===o)return r/(s-1);const h=i[r],p=i[r+1]-h,d=(o-h)/p;return(r+d)/(s-1)}getTangent(t,e){let r=t-1e-4,s=t+1e-4;r<0&&(r=0),s>1&&(s=1);const o=this.getPoint(r),a=this.getPoint(s),c=e||(o.isVector2?new st:new P);return c.copy(a).sub(o).normalize(),c}getTangentAt(t,e){const i=this.getUtoTmapping(t);return this.getTangent(i,e)}computeFrenetFrames(t,e){const i=new P,r=[],s=[],o=[],a=new P,c=new ue;for(let d=0;d<=t;d++){const _=d/t;r[d]=this.getTangentAt(_,new P)}s[0]=new P,o[0]=new P;let l=Number.MAX_VALUE;const h=Math.abs(r[0].x),u=Math.abs(r[0].y),p=Math.abs(r[0].z);h<=l&&(l=h,i.set(1,0,0)),u<=l&&(l=u,i.set(0,1,0)),p<=l&&i.set(0,0,1),a.crossVectors(r[0],i).normalize(),s[0].crossVectors(r[0],a),o[0].crossVectors(r[0],s[0]);for(let d=1;d<=t;d++){if(s[d]=s[d-1].clone(),o[d]=o[d-1].clone(),a.crossVectors(r[d-1],r[d]),a.length()>Number.EPSILON){a.normalize();const _=Math.acos(xe(r[d-1].dot(r[d]),-1,1));s[d].applyMatrix4(c.makeRotationAxis(a,_))}o[d].crossVectors(r[d],s[d])}if(e===!0){let d=Math.acos(xe(s[0].dot(s[t]),-1,1));d/=t,r[0].dot(a.crossVectors(s[0],s[t]))>0&&(d=-d);for(let _=1;_<=t;_++)s[_].applyMatrix4(c.makeRotationAxis(r[_],d*_)),o[_].crossVectors(r[_],s[_])}return{tangents:r,normals:s,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class ao extends an{constructor(t=0,e=0,i=1,r=1,s=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=i,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(t,e){const i=e||new st,r=Math.PI*2;let s=this.aEndAngle-this.aStartAngle;const o=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(o?s=0:s=r),this.aClockwise===!0&&!o&&(s===r?s=-r:s=s-r);const a=this.aStartAngle+t*s;let c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){const h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),p=c-this.aX,d=l-this.aY;c=p*h-d*u+this.aX,l=p*u+d*h+this.aY}return i.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class nm extends ao{constructor(t,e,i,r,s,o){super(t,e,i,i,r,s,o),this.isArcCurve=!0,this.type="ArcCurve"}}function co(){let n=0,t=0,e=0,i=0;function r(s,o,a,c){n=s,t=a,e=-3*s+3*o-2*a-c,i=2*s-2*o+a+c}return{initCatmullRom:function(s,o,a,c,l){r(o,a,l*(a-s),l*(c-o))},initNonuniformCatmullRom:function(s,o,a,c,l,h,u){let p=(o-s)/l-(a-s)/(l+h)+(a-o)/h,d=(a-o)/h-(c-o)/(h+u)+(c-a)/u;p*=h,d*=h,r(o,a,p,d)},calc:function(s){const o=s*s,a=o*s;return n+t*s+e*o+i*a}}}const Ar=new P,Ls=new co,Ds=new co,Us=new co;class im extends an{constructor(t=[],e=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=i,this.tension=r}getPoint(t,e=new P){const i=e,r=this.points,s=r.length,o=(s-(this.closed?0:1))*t;let a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/s)+1)*s:c===0&&a===s-1&&(a=s-2,c=1);let l,h;this.closed||a>0?l=r[(a-1)%s]:(Ar.subVectors(r[0],r[1]).add(r[0]),l=Ar);const u=r[a%s],p=r[(a+1)%s];if(this.closed||a+2<s?h=r[(a+2)%s]:(Ar.subVectors(r[s-1],r[s-2]).add(r[s-1]),h=Ar),this.curveType==="centripetal"||this.curveType==="chordal"){const d=this.curveType==="chordal"?.5:.25;let _=Math.pow(l.distanceToSquared(u),d),g=Math.pow(u.distanceToSquared(p),d),m=Math.pow(p.distanceToSquared(h),d);g<1e-4&&(g=1),_<1e-4&&(_=g),m<1e-4&&(m=g),Ls.initNonuniformCatmullRom(l.x,u.x,p.x,h.x,_,g,m),Ds.initNonuniformCatmullRom(l.y,u.y,p.y,h.y,_,g,m),Us.initNonuniformCatmullRom(l.z,u.z,p.z,h.z,_,g,m)}else this.curveType==="catmullrom"&&(Ls.initCatmullRom(l.x,u.x,p.x,h.x,this.tension),Ds.initCatmullRom(l.y,u.y,p.y,h.y,this.tension),Us.initCatmullRom(l.z,u.z,p.z,h.z,this.tension));return i.set(Ls.calc(c),Ds.calc(c),Us.calc(c)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(r.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){const r=this.points[e];t.points.push(r.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(new P().fromArray(r))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function Va(n,t,e,i,r){const s=(i-t)*.5,o=(r-e)*.5,a=n*n,c=n*a;return(2*e-2*i+s+o)*c+(-3*e+3*i-2*s-o)*a+s*n+e}function rm(n,t){const e=1-n;return e*e*t}function sm(n,t){return 2*(1-n)*n*t}function om(n,t){return n*n*t}function Vi(n,t,e,i){return rm(n,t)+sm(n,e)+om(n,i)}function am(n,t){const e=1-n;return e*e*e*t}function cm(n,t){const e=1-n;return 3*e*e*n*t}function lm(n,t){return 3*(1-n)*n*n*t}function hm(n,t){return n*n*n*t}function ki(n,t,e,i,r){return am(n,t)+cm(n,e)+lm(n,i)+hm(n,r)}class Cc extends an{constructor(t=new st,e=new st,i=new st,r=new st){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=i,this.v3=r}getPoint(t,e=new st){const i=e,r=this.v0,s=this.v1,o=this.v2,a=this.v3;return i.set(ki(t,r.x,s.x,o.x,a.x),ki(t,r.y,s.y,o.y,a.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class um extends an{constructor(t=new P,e=new P,i=new P,r=new P){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=i,this.v3=r}getPoint(t,e=new P){const i=e,r=this.v0,s=this.v1,o=this.v2,a=this.v3;return i.set(ki(t,r.x,s.x,o.x,a.x),ki(t,r.y,s.y,o.y,a.y),ki(t,r.z,s.z,o.z,a.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Pc extends an{constructor(t=new st,e=new st){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new st){const i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new st){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class fm extends an{constructor(t=new P,e=new P){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new P){const i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new P){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Lc extends an{constructor(t=new st,e=new st,i=new st){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new st){const i=e,r=this.v0,s=this.v1,o=this.v2;return i.set(Vi(t,r.x,s.x,o.x),Vi(t,r.y,s.y,o.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class dm extends an{constructor(t=new P,e=new P,i=new P){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new P){const i=e,r=this.v0,s=this.v1,o=this.v2;return i.set(Vi(t,r.x,s.x,o.x),Vi(t,r.y,s.y,o.y),Vi(t,r.z,s.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Dc extends an{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new st){const i=e,r=this.points,s=(r.length-1)*t,o=Math.floor(s),a=s-o,c=r[o===0?o:o-1],l=r[o],h=r[o>r.length-2?r.length-1:o+1],u=r[o>r.length-3?r.length-1:o+2];return i.set(Va(a,c.x,l.x,h.x,u.x),Va(a,c.y,l.y,h.y,u.y)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(r.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){const r=this.points[e];t.points.push(r.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(new st().fromArray(r))}return this}}var Ys=Object.freeze({__proto__:null,ArcCurve:nm,CatmullRomCurve3:im,CubicBezierCurve:Cc,CubicBezierCurve3:um,EllipseCurve:ao,LineCurve:Pc,LineCurve3:fm,QuadraticBezierCurve:Lc,QuadraticBezierCurve3:dm,SplineCurve:Dc});class pm extends an{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const i=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Ys[i](e,t))}return this}getPoint(t,e){const i=t*this.getLength(),r=this.getCurveLengths();let s=0;for(;s<r.length;){if(r[s]>=i){const o=r[s]-i,a=this.curves[s],c=a.getLength(),l=c===0?0:1-o/c;return a.getPointAt(l,e)}s++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let i=0,r=this.curves.length;i<r;i++)e+=this.curves[i].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let i;for(let r=0,s=this.curves;r<s.length;r++){const o=s[r],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,c=o.getPoints(a);for(let l=0;l<c.length;l++){const h=c[l];i&&i.equals(h)||(e.push(h),i=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){const r=t.curves[e];this.curves.push(r.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,i=this.curves.length;e<i;e++){const r=this.curves[e];t.curves.push(r.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){const r=t.curves[e];this.curves.push(new Ys[r.type]().fromJSON(r))}return this}}class Zi extends pm{constructor(t){super(),this.type="Path",this.currentPoint=new st,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,i=t.length;e<i;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const i=new Pc(this.currentPoint.clone(),new st(t,e));return this.curves.push(i),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,i,r){const s=new Lc(this.currentPoint.clone(),new st(t,e),new st(i,r));return this.curves.push(s),this.currentPoint.set(i,r),this}bezierCurveTo(t,e,i,r,s,o){const a=new Cc(this.currentPoint.clone(),new st(t,e),new st(i,r),new st(s,o));return this.curves.push(a),this.currentPoint.set(s,o),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),i=new Dc(e);return this.curves.push(i),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,i,r,s,o){const a=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(t+a,e+c,i,r,s,o),this}absarc(t,e,i,r,s,o){return this.absellipse(t,e,i,i,r,s,o),this}ellipse(t,e,i,r,s,o,a,c){const l=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+l,e+h,i,r,s,o,a,c),this}absellipse(t,e,i,r,s,o,a,c){const l=new ao(t,e,i,r,s,o,a,c);if(this.curves.length>0){const u=l.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(l);const h=l.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class qr extends Be{constructor(t=[new st(0,-.5),new st(.5,0),new st(0,.5)],e=12,i=0,r=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:i,phiLength:r},e=Math.floor(e),r=xe(r,0,Math.PI*2);const s=[],o=[],a=[],c=[],l=[],h=1/e,u=new P,p=new st,d=new P,_=new P,g=new P;let m=0,f=0;for(let x=0;x<=t.length-1;x++)switch(x){case 0:m=t[x+1].x-t[x].x,f=t[x+1].y-t[x].y,d.x=f*1,d.y=-m,d.z=f*0,g.copy(d),d.normalize(),c.push(d.x,d.y,d.z);break;case t.length-1:c.push(g.x,g.y,g.z);break;default:m=t[x+1].x-t[x].x,f=t[x+1].y-t[x].y,d.x=f*1,d.y=-m,d.z=f*0,_.copy(d),d.x+=g.x,d.y+=g.y,d.z+=g.z,d.normalize(),c.push(d.x,d.y,d.z),g.copy(_)}for(let x=0;x<=e;x++){const v=i+x*h*r,A=Math.sin(v),N=Math.cos(v);for(let w=0;w<=t.length-1;w++){u.x=t[w].x*A,u.y=t[w].y,u.z=t[w].x*N,o.push(u.x,u.y,u.z),p.x=x/e,p.y=w/(t.length-1),a.push(p.x,p.y);const R=c[3*w+0]*A,C=c[3*w+1],S=c[3*w+0]*N;l.push(R,C,S)}}for(let x=0;x<e;x++)for(let v=0;v<t.length-1;v++){const A=v+x*t.length,N=A,w=A+t.length,R=A+t.length+1,C=A+1;s.push(N,w,C),s.push(R,C,w)}this.setIndex(s),this.setAttribute("position",new Qt(o,3)),this.setAttribute("uv",new Qt(a,2)),this.setAttribute("normal",new Qt(l,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new qr(t.points,t.segments,t.phiStart,t.phiLength)}}class Ti extends qr{constructor(t=1,e=1,i=4,r=8){const s=new Zi;s.absarc(0,-e/2,t,Math.PI*1.5,0),s.absarc(0,e/2,t,0,Math.PI*.5),super(s.getPoints(i),r),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:i,radialSegments:r}}static fromJSON(t){return new Ti(t.radius,t.length,t.capSegments,t.radialSegments)}}class Yr extends Be{constructor(t=1,e=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:i,thetaLength:r},e=Math.max(3,e);const s=[],o=[],a=[],c=[],l=new P,h=new st;o.push(0,0,0),a.push(0,0,1),c.push(.5,.5);for(let u=0,p=3;u<=e;u++,p+=3){const d=i+u/e*r;l.x=t*Math.cos(d),l.y=t*Math.sin(d),o.push(l.x,l.y,l.z),a.push(0,0,1),h.x=(o[p]/t+1)/2,h.y=(o[p+1]/t+1)/2,c.push(h.x,h.y)}for(let u=1;u<=e;u++)s.push(u,u+1,0);this.setIndex(s),this.setAttribute("position",new Qt(o,3)),this.setAttribute("normal",new Qt(a,3)),this.setAttribute("uv",new Qt(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Yr(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class xi extends Be{constructor(t=1,e=1,i=1,r=32,s=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:i,radialSegments:r,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:c};const l=this;r=Math.floor(r),s=Math.floor(s);const h=[],u=[],p=[],d=[];let _=0;const g=[],m=i/2;let f=0;x(),o===!1&&(t>0&&v(!0),e>0&&v(!1)),this.setIndex(h),this.setAttribute("position",new Qt(u,3)),this.setAttribute("normal",new Qt(p,3)),this.setAttribute("uv",new Qt(d,2));function x(){const A=new P,N=new P;let w=0;const R=(e-t)/i;for(let C=0;C<=s;C++){const S=[],E=C/s,D=E*(e-t)+t;for(let B=0;B<=r;B++){const z=B/r,b=z*c+a,U=Math.sin(b),O=Math.cos(b);N.x=D*U,N.y=-E*i+m,N.z=D*O,u.push(N.x,N.y,N.z),A.set(U,R,O).normalize(),p.push(A.x,A.y,A.z),d.push(z,1-E),S.push(_++)}g.push(S)}for(let C=0;C<r;C++)for(let S=0;S<s;S++){const E=g[S][C],D=g[S+1][C],B=g[S+1][C+1],z=g[S][C+1];h.push(E,D,z),h.push(D,B,z),w+=6}l.addGroup(f,w,0),f+=w}function v(A){const N=_,w=new st,R=new P;let C=0;const S=A===!0?t:e,E=A===!0?1:-1;for(let B=1;B<=r;B++)u.push(0,m*E,0),p.push(0,E,0),d.push(.5,.5),_++;const D=_;for(let B=0;B<=r;B++){const b=B/r*c+a,U=Math.cos(b),O=Math.sin(b);R.x=S*O,R.y=m*E,R.z=S*U,u.push(R.x,R.y,R.z),p.push(0,E,0),w.x=U*.5+.5,w.y=O*.5*E+.5,d.push(w.x,w.y),_++}for(let B=0;B<r;B++){const z=N+B,b=D+B;A===!0?h.push(b,b+1,z):h.push(b+1,b,z),C+=3}l.addGroup(f,C,A===!0?1:2),f+=C}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new xi(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Pi extends Zi{constructor(t){super(t),this.uuid=wi(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let i=0,r=this.holes.length;i<r;i++)e[i]=this.holes[i].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,i=t.holes.length;e<i;e++){const r=t.holes[e];this.holes.push(r.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,i=this.holes.length;e<i;e++){const r=this.holes[e];t.holes.push(r.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,i=t.holes.length;e<i;e++){const r=t.holes[e];this.holes.push(new Zi().fromJSON(r))}return this}}const mm={triangulate:function(n,t,e=2){const i=t&&t.length,r=i?t[0]*e:n.length;let s=Uc(n,0,r,e,!0);const o=[];if(!s||s.next===s.prev)return o;let a,c,l,h,u,p,d;if(i&&(s=Mm(n,t,s,e)),n.length>80*e){a=l=n[0],c=h=n[1];for(let _=e;_<r;_+=e)u=n[_],p=n[_+1],u<a&&(a=u),p<c&&(c=p),u>l&&(l=u),p>h&&(h=p);d=Math.max(l-a,h-c),d=d!==0?32767/d:0}return Ji(s,o,e,a,c,d,0),o}};function Uc(n,t,e,i,r){let s,o;if(r===Lm(n,t,e,i)>0)for(s=t;s<e;s+=i)o=ka(s,n[s],n[s+1],o);else for(s=e-i;s>=t;s-=i)o=ka(s,n[s],n[s+1],o);return o&&Zr(o,o.next)&&(ji(o),o=o.next),o}function Jn(n,t){if(!n)return n;t||(t=n);let e=n,i;do if(i=!1,!e.steiner&&(Zr(e,e.next)||oe(e.prev,e,e.next)===0)){if(ji(e),e=t=e.prev,e===e.next)break;i=!0}else e=e.next;while(i||e!==t);return t}function Ji(n,t,e,i,r,s,o){if(!n)return;!o&&s&&Am(n,i,r,s);let a=n,c,l;for(;n.prev!==n.next;){if(c=n.prev,l=n.next,s?gm(n,i,r,s):_m(n)){t.push(c.i/e|0),t.push(n.i/e|0),t.push(l.i/e|0),ji(n),n=l.next,a=l.next;continue}if(n=l,n===a){o?o===1?(n=vm(Jn(n),t,e),Ji(n,t,e,i,r,s,2)):o===2&&xm(n,t,e,i,r,s):Ji(Jn(n),t,e,i,r,s,1);break}}}function _m(n){const t=n.prev,e=n,i=n.next;if(oe(t,e,i)>=0)return!1;const r=t.x,s=e.x,o=i.x,a=t.y,c=e.y,l=i.y,h=r<s?r<o?r:o:s<o?s:o,u=a<c?a<l?a:l:c<l?c:l,p=r>s?r>o?r:o:s>o?s:o,d=a>c?a>l?a:l:c>l?c:l;let _=i.next;for(;_!==t;){if(_.x>=h&&_.x<=p&&_.y>=u&&_.y<=d&&mi(r,a,s,c,o,l,_.x,_.y)&&oe(_.prev,_,_.next)>=0)return!1;_=_.next}return!0}function gm(n,t,e,i){const r=n.prev,s=n,o=n.next;if(oe(r,s,o)>=0)return!1;const a=r.x,c=s.x,l=o.x,h=r.y,u=s.y,p=o.y,d=a<c?a<l?a:l:c<l?c:l,_=h<u?h<p?h:p:u<p?u:p,g=a>c?a>l?a:l:c>l?c:l,m=h>u?h>p?h:p:u>p?u:p,f=Zs(d,_,t,e,i),x=Zs(g,m,t,e,i);let v=n.prevZ,A=n.nextZ;for(;v&&v.z>=f&&A&&A.z<=x;){if(v.x>=d&&v.x<=g&&v.y>=_&&v.y<=m&&v!==r&&v!==o&&mi(a,h,c,u,l,p,v.x,v.y)&&oe(v.prev,v,v.next)>=0||(v=v.prevZ,A.x>=d&&A.x<=g&&A.y>=_&&A.y<=m&&A!==r&&A!==o&&mi(a,h,c,u,l,p,A.x,A.y)&&oe(A.prev,A,A.next)>=0))return!1;A=A.nextZ}for(;v&&v.z>=f;){if(v.x>=d&&v.x<=g&&v.y>=_&&v.y<=m&&v!==r&&v!==o&&mi(a,h,c,u,l,p,v.x,v.y)&&oe(v.prev,v,v.next)>=0)return!1;v=v.prevZ}for(;A&&A.z<=x;){if(A.x>=d&&A.x<=g&&A.y>=_&&A.y<=m&&A!==r&&A!==o&&mi(a,h,c,u,l,p,A.x,A.y)&&oe(A.prev,A,A.next)>=0)return!1;A=A.nextZ}return!0}function vm(n,t,e){let i=n;do{const r=i.prev,s=i.next.next;!Zr(r,s)&&Ic(r,i,i.next,s)&&Ki(r,s)&&Ki(s,r)&&(t.push(r.i/e|0),t.push(i.i/e|0),t.push(s.i/e|0),ji(i),ji(i.next),i=n=s),i=i.next}while(i!==n);return Jn(i)}function xm(n,t,e,i,r,s){let o=n;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&Rm(o,a)){let c=Nc(o,a);o=Jn(o,o.next),c=Jn(c,c.next),Ji(o,t,e,i,r,s,0),Ji(c,t,e,i,r,s,0);return}a=a.next}o=o.next}while(o!==n)}function Mm(n,t,e,i){const r=[];let s,o,a,c,l;for(s=0,o=t.length;s<o;s++)a=t[s]*i,c=s<o-1?t[s+1]*i:n.length,l=Uc(n,a,c,i,!1),l===l.next&&(l.steiner=!0),r.push(wm(l));for(r.sort(Sm),s=0;s<r.length;s++)e=ym(r[s],e);return e}function Sm(n,t){return n.x-t.x}function ym(n,t){const e=Em(n,t);if(!e)return t;const i=Nc(e,n);return Jn(i,i.next),Jn(e,e.next)}function Em(n,t){let e=t,i=-1/0,r;const s=n.x,o=n.y;do{if(o<=e.y&&o>=e.next.y&&e.next.y!==e.y){const p=e.x+(o-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(p<=s&&p>i&&(i=p,r=e.x<e.next.x?e:e.next,p===s))return r}e=e.next}while(e!==t);if(!r)return null;const a=r,c=r.x,l=r.y;let h=1/0,u;e=r;do s>=e.x&&e.x>=c&&s!==e.x&&mi(o<l?s:i,o,c,l,o<l?i:s,o,e.x,e.y)&&(u=Math.abs(o-e.y)/(s-e.x),Ki(e,n)&&(u<h||u===h&&(e.x>r.x||e.x===r.x&&Tm(r,e)))&&(r=e,h=u)),e=e.next;while(e!==a);return r}function Tm(n,t){return oe(n.prev,n,t.prev)<0&&oe(t.next,n,n.next)<0}function Am(n,t,e,i){let r=n;do r.z===0&&(r.z=Zs(r.x,r.y,t,e,i)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==n);r.prevZ.nextZ=null,r.prevZ=null,bm(r)}function bm(n){let t,e,i,r,s,o,a,c,l=1;do{for(e=n,n=null,s=null,o=0;e;){for(o++,i=e,a=0,t=0;t<l&&(a++,i=i.nextZ,!!i);t++);for(c=l;a>0||c>0&&i;)a!==0&&(c===0||!i||e.z<=i.z)?(r=e,e=e.nextZ,a--):(r=i,i=i.nextZ,c--),s?s.nextZ=r:n=r,r.prevZ=s,s=r;e=i}s.nextZ=null,l*=2}while(o>1);return n}function Zs(n,t,e,i,r){return n=(n-e)*r|0,t=(t-i)*r|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,n|t<<1}function wm(n){let t=n,e=n;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==n);return e}function mi(n,t,e,i,r,s,o,a){return(r-o)*(t-a)>=(n-o)*(s-a)&&(n-o)*(i-a)>=(e-o)*(t-a)&&(e-o)*(s-a)>=(r-o)*(i-a)}function Rm(n,t){return n.next.i!==t.i&&n.prev.i!==t.i&&!Cm(n,t)&&(Ki(n,t)&&Ki(t,n)&&Pm(n,t)&&(oe(n.prev,n,t.prev)||oe(n,t.prev,t))||Zr(n,t)&&oe(n.prev,n,n.next)>0&&oe(t.prev,t,t.next)>0)}function oe(n,t,e){return(t.y-n.y)*(e.x-t.x)-(t.x-n.x)*(e.y-t.y)}function Zr(n,t){return n.x===t.x&&n.y===t.y}function Ic(n,t,e,i){const r=wr(oe(n,t,e)),s=wr(oe(n,t,i)),o=wr(oe(e,i,n)),a=wr(oe(e,i,t));return!!(r!==s&&o!==a||r===0&&br(n,e,t)||s===0&&br(n,i,t)||o===0&&br(e,n,i)||a===0&&br(e,t,i))}function br(n,t,e){return t.x<=Math.max(n.x,e.x)&&t.x>=Math.min(n.x,e.x)&&t.y<=Math.max(n.y,e.y)&&t.y>=Math.min(n.y,e.y)}function wr(n){return n>0?1:n<0?-1:0}function Cm(n,t){let e=n;do{if(e.i!==n.i&&e.next.i!==n.i&&e.i!==t.i&&e.next.i!==t.i&&Ic(e,e.next,n,t))return!0;e=e.next}while(e!==n);return!1}function Ki(n,t){return oe(n.prev,n,n.next)<0?oe(n,t,n.next)>=0&&oe(n,n.prev,t)>=0:oe(n,t,n.prev)<0||oe(n,n.next,t)<0}function Pm(n,t){let e=n,i=!1;const r=(n.x+t.x)/2,s=(n.y+t.y)/2;do e.y>s!=e.next.y>s&&e.next.y!==e.y&&r<(e.next.x-e.x)*(s-e.y)/(e.next.y-e.y)+e.x&&(i=!i),e=e.next;while(e!==n);return i}function Nc(n,t){const e=new Js(n.i,n.x,n.y),i=new Js(t.i,t.x,t.y),r=n.next,s=t.prev;return n.next=t,t.prev=n,e.next=r,r.prev=e,i.next=e,e.prev=i,s.next=i,i.prev=s,i}function ka(n,t,e,i){const r=new Js(n,t,e);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function ji(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function Js(n,t,e){this.i=n,this.x=t,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function Lm(n,t,e,i){let r=0;for(let s=t,o=e-i;s<e;s+=i)r+=(n[o]-n[s])*(n[s+1]+n[o+1]),o=s;return r}class Cn{static area(t){const e=t.length;let i=0;for(let r=e-1,s=0;s<e;r=s++)i+=t[r].x*t[s].y-t[s].x*t[r].y;return i*.5}static isClockWise(t){return Cn.area(t)<0}static triangulateShape(t,e){const i=[],r=[],s=[];Wa(t),Xa(i,t);let o=t.length;e.forEach(Wa);for(let c=0;c<e.length;c++)r.push(o),o+=e[c].length,Xa(i,e[c]);const a=mm.triangulate(i,r);for(let c=0;c<a.length;c+=3)s.push(a.slice(c,c+3));return s}}function Wa(n){const t=n.length;t>2&&n[t-1].equals(n[0])&&n.pop()}function Xa(n,t){for(let e=0;e<t.length;e++)n.push(t[e].x),n.push(t[e].y)}class Pn extends Be{constructor(t=new Pi([new st(.5,.5),new st(-.5,.5),new st(-.5,-.5),new st(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const i=this,r=[],s=[];for(let a=0,c=t.length;a<c;a++){const l=t[a];o(l)}this.setAttribute("position",new Qt(r,3)),this.setAttribute("uv",new Qt(s,2)),this.computeVertexNormals();function o(a){const c=[],l=e.curveSegments!==void 0?e.curveSegments:12,h=e.steps!==void 0?e.steps:1,u=e.depth!==void 0?e.depth:1;let p=e.bevelEnabled!==void 0?e.bevelEnabled:!0,d=e.bevelThickness!==void 0?e.bevelThickness:.2,_=e.bevelSize!==void 0?e.bevelSize:d-.1,g=e.bevelOffset!==void 0?e.bevelOffset:0,m=e.bevelSegments!==void 0?e.bevelSegments:3;const f=e.extrudePath,x=e.UVGenerator!==void 0?e.UVGenerator:Dm;let v,A=!1,N,w,R,C;f&&(v=f.getSpacedPoints(h),A=!0,p=!1,N=f.computeFrenetFrames(h,!1),w=new P,R=new P,C=new P),p||(m=0,d=0,_=0,g=0);const S=a.extractPoints(l);let E=S.shape;const D=S.holes;if(!Cn.isClockWise(E)){E=E.reverse();for(let L=0,ot=D.length;L<ot;L++){const j=D[L];Cn.isClockWise(j)&&(D[L]=j.reverse())}}const z=Cn.triangulateShape(E,D),b=E;for(let L=0,ot=D.length;L<ot;L++){const j=D[L];E=E.concat(j)}function U(L,ot,j){return ot||console.error("THREE.ExtrudeGeometry: vec does not exist"),L.clone().addScaledVector(ot,j)}const O=E.length,q=z.length;function Z(L,ot,j){let rt,K,Tt;const pt=L.x-ot.x,y=L.y-ot.y,M=j.x-L.x,H=j.y-L.y,it=pt*pt+y*y,et=pt*H-y*M;if(Math.abs(et)>Number.EPSILON){const Q=Math.sqrt(it),Mt=Math.sqrt(M*M+H*H),ht=ot.x-y/Q,gt=ot.y+pt/Q,bt=j.x-H/Mt,Ft=j.y+M/Mt,nt=((bt-ht)*H-(Ft-gt)*M)/(pt*H-y*M);rt=ht+pt*nt-L.x,K=gt+y*nt-L.y;const Jt=rt*rt+K*K;if(Jt<=2)return new st(rt,K);Tt=Math.sqrt(Jt/2)}else{let Q=!1;pt>Number.EPSILON?M>Number.EPSILON&&(Q=!0):pt<-Number.EPSILON?M<-Number.EPSILON&&(Q=!0):Math.sign(y)===Math.sign(H)&&(Q=!0),Q?(rt=-y,K=pt,Tt=Math.sqrt(it)):(rt=pt,K=y,Tt=Math.sqrt(it/2))}return new st(rt/Tt,K/Tt)}const k=[];for(let L=0,ot=b.length,j=ot-1,rt=L+1;L<ot;L++,j++,rt++)j===ot&&(j=0),rt===ot&&(rt=0),k[L]=Z(b[L],b[j],b[rt]);const J=[];let $,lt=k.concat();for(let L=0,ot=D.length;L<ot;L++){const j=D[L];$=[];for(let rt=0,K=j.length,Tt=K-1,pt=rt+1;rt<K;rt++,Tt++,pt++)Tt===K&&(Tt=0),pt===K&&(pt=0),$[rt]=Z(j[rt],j[Tt],j[pt]);J.push($),lt=lt.concat($)}for(let L=0;L<m;L++){const ot=L/m,j=d*Math.cos(ot*Math.PI/2),rt=_*Math.sin(ot*Math.PI/2)+g;for(let K=0,Tt=b.length;K<Tt;K++){const pt=U(b[K],k[K],rt);_t(pt.x,pt.y,-j)}for(let K=0,Tt=D.length;K<Tt;K++){const pt=D[K];$=J[K];for(let y=0,M=pt.length;y<M;y++){const H=U(pt[y],$[y],rt);_t(H.x,H.y,-j)}}}const Y=_+g;for(let L=0;L<O;L++){const ot=p?U(E[L],lt[L],Y):E[L];A?(R.copy(N.normals[0]).multiplyScalar(ot.x),w.copy(N.binormals[0]).multiplyScalar(ot.y),C.copy(v[0]).add(R).add(w),_t(C.x,C.y,C.z)):_t(ot.x,ot.y,0)}for(let L=1;L<=h;L++)for(let ot=0;ot<O;ot++){const j=p?U(E[ot],lt[ot],Y):E[ot];A?(R.copy(N.normals[L]).multiplyScalar(j.x),w.copy(N.binormals[L]).multiplyScalar(j.y),C.copy(v[L]).add(R).add(w),_t(C.x,C.y,C.z)):_t(j.x,j.y,u/h*L)}for(let L=m-1;L>=0;L--){const ot=L/m,j=d*Math.cos(ot*Math.PI/2),rt=_*Math.sin(ot*Math.PI/2)+g;for(let K=0,Tt=b.length;K<Tt;K++){const pt=U(b[K],k[K],rt);_t(pt.x,pt.y,u+j)}for(let K=0,Tt=D.length;K<Tt;K++){const pt=D[K];$=J[K];for(let y=0,M=pt.length;y<M;y++){const H=U(pt[y],$[y],rt);A?_t(H.x,H.y+v[h-1].y,v[h-1].x+j):_t(H.x,H.y,u+j)}}}tt(),dt();function tt(){const L=r.length/3;if(p){let ot=0,j=O*ot;for(let rt=0;rt<q;rt++){const K=z[rt];Ct(K[2]+j,K[1]+j,K[0]+j)}ot=h+m*2,j=O*ot;for(let rt=0;rt<q;rt++){const K=z[rt];Ct(K[0]+j,K[1]+j,K[2]+j)}}else{for(let ot=0;ot<q;ot++){const j=z[ot];Ct(j[2],j[1],j[0])}for(let ot=0;ot<q;ot++){const j=z[ot];Ct(j[0]+O*h,j[1]+O*h,j[2]+O*h)}}i.addGroup(L,r.length/3-L,0)}function dt(){const L=r.length/3;let ot=0;St(b,ot),ot+=b.length;for(let j=0,rt=D.length;j<rt;j++){const K=D[j];St(K,ot),ot+=K.length}i.addGroup(L,r.length/3-L,1)}function St(L,ot){let j=L.length;for(;--j>=0;){const rt=j;let K=j-1;K<0&&(K=L.length-1);for(let Tt=0,pt=h+m*2;Tt<pt;Tt++){const y=O*Tt,M=O*(Tt+1),H=ot+rt+y,it=ot+K+y,et=ot+K+M,Q=ot+rt+M;It(H,it,et,Q)}}}function _t(L,ot,j){c.push(L),c.push(ot),c.push(j)}function Ct(L,ot,j){yt(L),yt(ot),yt(j);const rt=r.length/3,K=x.generateTopUV(i,r,rt-3,rt-2,rt-1);Dt(K[0]),Dt(K[1]),Dt(K[2])}function It(L,ot,j,rt){yt(L),yt(ot),yt(rt),yt(ot),yt(j),yt(rt);const K=r.length/3,Tt=x.generateSideWallUV(i,r,K-6,K-3,K-2,K-1);Dt(Tt[0]),Dt(Tt[1]),Dt(Tt[3]),Dt(Tt[1]),Dt(Tt[2]),Dt(Tt[3])}function yt(L){r.push(c[L*3+0]),r.push(c[L*3+1]),r.push(c[L*3+2])}function Dt(L){s.push(L.x),s.push(L.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,i=this.parameters.options;return Um(e,i,t)}static fromJSON(t,e){const i=[];for(let s=0,o=t.shapes.length;s<o;s++){const a=e[t.shapes[s]];i.push(a)}const r=t.options.extrudePath;return r!==void 0&&(t.options.extrudePath=new Ys[r.type]().fromJSON(r)),new Pn(i,t.options)}}const Dm={generateTopUV:function(n,t,e,i,r){const s=t[e*3],o=t[e*3+1],a=t[i*3],c=t[i*3+1],l=t[r*3],h=t[r*3+1];return[new st(s,o),new st(a,c),new st(l,h)]},generateSideWallUV:function(n,t,e,i,r,s){const o=t[e*3],a=t[e*3+1],c=t[e*3+2],l=t[i*3],h=t[i*3+1],u=t[i*3+2],p=t[r*3],d=t[r*3+1],_=t[r*3+2],g=t[s*3],m=t[s*3+1],f=t[s*3+2];return Math.abs(a-h)<Math.abs(o-l)?[new st(o,1-c),new st(l,1-u),new st(p,1-_),new st(g,1-f)]:[new st(a,1-c),new st(h,1-u),new st(d,1-_),new st(m,1-f)]}};function Um(n,t,e){if(e.shapes=[],Array.isArray(n))for(let i=0,r=n.length;i<r;i++){const s=n[i];e.shapes.push(s.uuid)}else e.shapes.push(n.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class Fr extends Be{constructor(t=new Pi([new st(0,.5),new st(-.5,-.5),new st(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};const i=[],r=[],s=[],o=[];let a=0,c=0;if(Array.isArray(t)===!1)l(t);else for(let h=0;h<t.length;h++)l(t[h]),this.addGroup(a,c,h),a+=c,c=0;this.setIndex(i),this.setAttribute("position",new Qt(r,3)),this.setAttribute("normal",new Qt(s,3)),this.setAttribute("uv",new Qt(o,2));function l(h){const u=r.length/3,p=h.extractPoints(e);let d=p.shape;const _=p.holes;Cn.isClockWise(d)===!1&&(d=d.reverse());for(let m=0,f=_.length;m<f;m++){const x=_[m];Cn.isClockWise(x)===!0&&(_[m]=x.reverse())}const g=Cn.triangulateShape(d,_);for(let m=0,f=_.length;m<f;m++){const x=_[m];d=d.concat(x)}for(let m=0,f=d.length;m<f;m++){const x=d[m];r.push(x.x,x.y,0),s.push(0,0,1),o.push(x.x,x.y)}for(let m=0,f=g.length;m<f;m++){const x=g[m],v=x[0]+u,A=x[1]+u,N=x[2]+u;i.push(v,A,N),c+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes;return Im(e,t)}static fromJSON(t,e){const i=[];for(let r=0,s=t.shapes.length;r<s;r++){const o=e[t.shapes[r]];i.push(o)}return new Fr(i,t.curveSegments)}}function Im(n,t){if(t.shapes=[],Array.isArray(n))for(let e=0,i=n.length;e<i;e++){const r=n[e];t.shapes.push(r.uuid)}else t.shapes.push(n.uuid);return t}class Me extends Be{constructor(t=1,e=32,i=16,r=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:i,phiStart:r,phiLength:s,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),i=Math.max(2,Math.floor(i));const c=Math.min(o+a,Math.PI);let l=0;const h=[],u=new P,p=new P,d=[],_=[],g=[],m=[];for(let f=0;f<=i;f++){const x=[],v=f/i;let A=0;f===0&&o===0?A=.5/e:f===i&&c===Math.PI&&(A=-.5/e);for(let N=0;N<=e;N++){const w=N/e;u.x=-t*Math.cos(r+w*s)*Math.sin(o+v*a),u.y=t*Math.cos(o+v*a),u.z=t*Math.sin(r+w*s)*Math.sin(o+v*a),_.push(u.x,u.y,u.z),p.copy(u).normalize(),g.push(p.x,p.y,p.z),m.push(w+A,1-v),x.push(l++)}h.push(x)}for(let f=0;f<i;f++)for(let x=0;x<e;x++){const v=h[f][x+1],A=h[f][x],N=h[f+1][x],w=h[f+1][x+1];(f!==0||o>0)&&d.push(v,A,w),(f!==i-1||c<Math.PI)&&d.push(A,N,w)}this.setIndex(d),this.setAttribute("position",new Qt(_,3)),this.setAttribute("normal",new Qt(g,3)),this.setAttribute("uv",new Qt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Me(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class tr extends Be{constructor(t=1,e=.4,i=12,r=48,s=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:i,tubularSegments:r,arc:s},i=Math.floor(i),r=Math.floor(r);const o=[],a=[],c=[],l=[],h=new P,u=new P,p=new P;for(let d=0;d<=i;d++)for(let _=0;_<=r;_++){const g=_/r*s,m=d/i*Math.PI*2;u.x=(t+e*Math.cos(m))*Math.cos(g),u.y=(t+e*Math.cos(m))*Math.sin(g),u.z=e*Math.sin(m),a.push(u.x,u.y,u.z),h.x=t*Math.cos(g),h.y=t*Math.sin(g),p.subVectors(u,h).normalize(),c.push(p.x,p.y,p.z),l.push(_/r),l.push(d/i)}for(let d=1;d<=i;d++)for(let _=1;_<=r;_++){const g=(r+1)*d+_-1,m=(r+1)*(d-1)+_-1,f=(r+1)*(d-1)+_,x=(r+1)*d+_;o.push(g,m,x),o.push(m,f,x)}this.setIndex(o),this.setAttribute("position",new Qt(a,3)),this.setAttribute("normal",new Qt(c,3)),this.setAttribute("uv",new Qt(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new tr(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class Pe extends Qi{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Yt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Yt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=lc,this.normalScale=new st(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class lo extends Pe{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new st(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return xe(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Yt(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Yt(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Yt(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class ho extends ye{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Yt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),e}}class Nm extends ho{constructor(t,e,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ye.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Yt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const Is=new ue,qa=new P,Ya=new P;class Fc{constructor(t){this.camera=t,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new st(512,512),this.map=null,this.mapPass=null,this.matrix=new ue,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new so,this._frameExtents=new st(1,1),this._viewportCount=1,this._viewports=[new re(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,i=this.matrix;qa.setFromMatrixPosition(t.matrixWorld),e.position.copy(qa),Ya.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Ya),e.updateMatrixWorld(),Is.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Is),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Is)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const Za=new ue,Bi=new P,Ns=new P;class Fm extends Fc{constructor(){super(new Ie(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new st(4,2),this._viewportCount=6,this._viewports=[new re(2,1,1,1),new re(0,1,1,1),new re(3,1,1,1),new re(1,1,1,1),new re(3,0,1,1),new re(1,0,1,1)],this._cubeDirections=[new P(1,0,0),new P(-1,0,0),new P(0,0,1),new P(0,0,-1),new P(0,1,0),new P(0,-1,0)],this._cubeUps=[new P(0,1,0),new P(0,1,0),new P(0,1,0),new P(0,1,0),new P(0,0,1),new P(0,0,-1)]}updateMatrices(t,e=0){const i=this.camera,r=this.matrix,s=t.distance||i.far;s!==i.far&&(i.far=s,i.updateProjectionMatrix()),Bi.setFromMatrixPosition(t.matrixWorld),i.position.copy(Bi),Ns.copy(i.position),Ns.add(this._cubeDirections[e]),i.up.copy(this._cubeUps[e]),i.lookAt(Ns),i.updateMatrixWorld(),r.makeTranslation(-Bi.x,-Bi.y,-Bi.z),Za.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Za)}}class Om extends ho{constructor(t,e,i=0,r=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new Fm}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class Bm extends Fc{constructor(){super(new kr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class zm extends ho{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ye.DEFAULT_UP),this.updateMatrix(),this.target=new ye,this.shadow=new Bm}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class Gm{constructor(t,e,i=0,r=1/0){this.ray=new mc(t,e),this.near=i,this.far=r,this.camera=null,this.layers=new ro,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}intersectObject(t,e=!0,i=[]){return Ks(t,this,i,e),i.sort(Ja),i}intersectObjects(t,e=!0,i=[]){for(let r=0,s=t.length;r<s;r++)Ks(t[r],this,i,e);return i.sort(Ja),i}}function Ja(n,t){return n.distance-t.distance}function Ks(n,t,e,i){if(n.layers.test(t.layers)&&n.raycast(t,e),i===!0){const r=n.children;for(let s=0,o=r.length;s<o;s++)Ks(r[s],t,e,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:to}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=to);const Gt=Math.PI;function xn(n){let t=n>>>0;return()=>(t=Math.imul(t,1664525)+1013904223>>>0,t/4294967296)}const $t=n=>new Yt(n),uo=n=>$t(n).multiplyScalar(1.22),Hm=(n,t)=>"#"+$t(n).lerp($t("#ffffff"),t).getHexString(),Oc=(n,t)=>"#"+$t(n).lerp($t("#000000"),t).getHexString(),Ka=new Map;function Kn(n,t,e,i,r=!0){const s=Ka.get(n);if(s)return s;const o=document.createElement("canvas");o.width=t,o.height=e;const a=o.getContext("2d");a&&i(a,t,e);const c=new em(o);return c.wrapS=c.wrapT=Pr,r&&(c.colorSpace=he),c.anisotropy=8,Ka.set(n,c),c}function Bc(n,t,e,i,r){const s=n.createRadialGradient(t,e,0,t,e,i);s.addColorStop(0,r),s.addColorStop(1,"rgba(128,128,128,0)"),n.fillStyle=s,n.fillRect(t-i,e-i,i*2,i*2)}function js(n,t,e,i,r,s,o,a,c){const l=xn(i);for(let h=0;h<r;h++){const u=l()*t,p=l()*e,d=s+l()*(o-s),_=l()<.5?a:c;for(let g=-1;g<=1;g++)for(let m=-1;m<=1;m++)u+g*t+d<0||u+g*t-d>t||p+m*e+d<0||p+m*e-d>e||Bc(n,u+g*t,p+m*e,d,_)}}function zc(n,t,e,i,r,s){const o=xn(i);for(let a=0;a<r;a++){const c=o()*e,l=.04+o()*s,h=1+o()*5,u=1+Math.floor(o()*3),p=o()*6.283;n.strokeStyle=`rgba(${o()<.8?"70,70,70":"0,0,0"},${l})`,n.lineWidth=.6+o()*1.8,n.beginPath();for(let d=0;d<=t;d+=16){const _=c+h*Math.sin(d/t*6.283*u+p);d===0?n.moveTo(d,_):n.lineTo(d,_)}n.stroke()}}const ja=()=>{const n=Kn("plaster",512,512,(t,e,i)=>{t.fillStyle="#ECECEC",t.fillRect(0,0,e,i),js(t,e,i,11,260,30,120,"rgba(60,55,50,0.07)","rgba(255,255,255,0.09)"),js(t,e,i,23,900,3,14,"rgba(40,36,32,0.05)","rgba(255,255,255,0.06)")});return n.repeat.set(.5,.5),n},Vm=()=>Kn("wood",512,512,(n,t,e)=>{n.fillStyle="#D6D6D6",n.fillRect(0,0,t,e),js(n,t,e,5,40,40,160,"rgba(90,90,90,0.25)","rgba(255,255,255,0.08)"),zc(n,t,e,17,240,.2)}),km=()=>Kn("planks",1024,1024,(n,t,e)=>{const i=xn(107),r=16,s=e/r;for(let o=0;o<r;o++){const a=2+(i()<.5?1:0),c=i()*t,l=[];for(let h=0;h<a;h++)l.push((c+h*t/a+(i()-.5)*t/a*.5+t)%t);l.sort((h,u)=>h-u);for(let h=0;h<a;h++){const u=l[h],p=h<a-1?l[h+1]:l[0]+t,d=Math.round(220-i()*60);n.fillStyle=`rgb(${d},${d},${d})`,n.fillRect(u,o*s,p-u,s),p>t&&n.fillRect(u-t,o*s,p-u,s),n.fillStyle="rgba(0,0,0,0.55)",n.fillRect(u-1,o*s,2,s)}}zc(n,t,e,33,1500,.16),n.fillStyle="rgba(0,0,0,0.5)";for(let o=0;o<=r;o++)n.fillRect(0,o*s-1,t,2)}),Li=()=>Kn("weave",256,256,(n,t,e)=>{n.fillStyle="#808080",n.fillRect(0,0,t,e);const i=xn(4);for(let r=0;r<5e3;r++)n.fillStyle=i()<.5?"rgba(0,0,0,0.12)":"rgba(255,255,255,0.12)",n.fillRect(i()*t,i()*e,1.5,1.5)},!1),Wm=()=>Kn("rug",1024,724,(n,t,e)=>{n.fillStyle="#E2E2E2",n.fillRect(0,0,t,e),n.strokeStyle="#F4F4F4",n.lineWidth=10,n.strokeRect(46,46,t-92,e-92),n.strokeStyle="rgba(90,90,90,0.45)",n.lineWidth=3,n.strokeRect(70,70,t-140,e-140);const i=xn(40);for(let r=0;r<26e3;r++)n.fillStyle=i()<.5?"rgba(0,0,0,0.07)":"rgba(255,255,255,0.08)",n.fillRect(i()*t,i()*e,2,2)}),Xm=n=>Kn(`sky${n?1:0}`,256,256,(t,e,i)=>{const r=t.createLinearGradient(0,0,0,i);n?(r.addColorStop(0,"#141A33"),r.addColorStop(.6,"#2B2A4A"),r.addColorStop(1,"#141A22")):(r.addColorStop(0,"#CFE3F2"),r.addColorStop(.55,"#F1F3EA"),r.addColorStop(.62,"#9DB790"),r.addColorStop(1,"#6F9068")),t.fillStyle=r,t.fillRect(0,0,e,i);const s=xn(12);for(let o=0;o<26;o++)Bc(t,s()*e,i*.5+s()*i*.5,20+s()*40,n?"rgba(10,20,18,0.5)":"rgba(74,120,80,0.5)")});function qm(n,t){return Kn(`art${n.join("")}${t}`,512,360,(e,i,r)=>{const s=xn(60+t*3);e.fillStyle=n[2],e.fillRect(0,0,i,r);for(let o=0;o<9;o++)e.fillStyle=n[Math.floor(s()*n.length)],e.globalAlpha=.82,e.fillRect(s()*i*.8,s()*r*.8,60+s()*200,50+s()*150);e.globalAlpha=1,e.strokeStyle=n[3],e.lineWidth=5,e.beginPath(),e.arc(i*(.3+s()*.4),r*.5,70,0,6.283),e.stroke()})}const De=(n,t,e=0)=>new Pe({color:$t(n),roughness:t,metalness:e}),ve=(n,t=.5)=>De(n,t,0),Se=n=>De(n,.34,1),ze=(n,t=.42)=>new Pe({map:Vm(),color:uo(n),roughness:t});function Ym(n){const t=$t(n);return new lo({color:t,roughness:.92,sheen:1,sheenRoughness:.42,sheenColor:t.clone().lerp($t("#ffffff"),.5),bumpMap:Li(),bumpScale:.0015})}const Zm=n=>new lo({color:$t(n),roughness:.48,clearcoat:.3,clearcoatRoughness:.55,bumpMap:Li(),bumpScale:8e-4}),$s=n=>new Pe({color:$t(n),roughness:.95,bumpMap:Li(),bumpScale:.002}),Jm=n=>new Pe({color:$t(n),roughness:1,bumpMap:Li(),bumpScale:.007}),vn=(n,t)=>n==="boucle"?Jm(t):n==="leather"?Zm(t):n==="velvet"?Ym(t):$s(t),fo=(n,t)=>new lo({color:$t(n),roughness:.04,transparent:!0,opacity:t,depthWrite:!1});function Gi(n,t=1){const e=(n?2.4:1.25)*t,i=new Yn;return i.color.setRGB(e,e*.84,e*.58),i}function I(n,t,e,i=0,r=0,s=0,o=!1){const a=new en(t,e);return a.position.set(i,r,s),a.castShadow=!o,a.receiveShadow=!0,n.add(a),a}const qt=(n,t,e)=>new Ri(n,t,e),Zt=(n,t,e,i=32)=>new xi(n,t,e,i);function Km(n,t,e){const i=new Pi,r=-n/2,s=-t/2;return e=Math.max(.001,Math.min(e,n/2-.001,t/2-.001)),i.moveTo(r+e,s),i.lineTo(r+n-e,s),i.absarc(r+n-e,s+e,e,-Gt/2,0,!1),i.lineTo(r+n,s+t-e),i.absarc(r+n-e,s+t-e,e,0,Gt/2,!1),i.lineTo(r+e,s+t),i.absarc(r+e,s+t-e,e,Gt/2,Gt,!1),i.lineTo(r,s+e),i.absarc(r+e,s+e,e,Gt,Gt*1.5,!1),i}function Gc(n,t,e=0,i=14){const r=new Pn(n,{depth:Math.max(.001,t-2*e),bevelEnabled:e>0,bevelThickness:e,bevelSize:e,bevelSegments:4,curveSegments:i});return r.rotateX(-Gt/2),r.translate(0,e,0),r}const vt=(n,t,e,i,r=0)=>Gc(Km(n-2*r,t-2*r,Math.max(.002,i-r)),e,r);function mn(n,t,e,i,r,s=0){n+=s,t-=s,e+=s/t,i-=s/t;const o=new Pi;return o.moveTo(t*Math.cos(e),t*Math.sin(e)),o.absarc(0,0,t,e,i,!1),o.lineTo(n*Math.cos(i),n*Math.sin(i)),o.absarc(0,0,n,i,e,!0),o.closePath(),Gc(o,r,s,40)}const Oe=(n,t=40)=>new qr(n.map(e=>new st(e[0],e[1])),t);function Wi(n,t,e=0){const i=new Pi,r=n/2;return i.moveTo(e,0),i.lineTo(e,t),i.absarc(e+r,t,r,Gt,0,!0),i.lineTo(e+n,0),i.closePath(),i}function _i(n,t,e,i){const r=new Pi;return r.moveTo(n,t),r.lineTo(n+e,t),r.lineTo(n+e,t+i),r.lineTo(n,t+i),r.closePath(),r}function Ai(n,t,e,i,r,s=0){for(const[o,a]of[[e,i],[-e,i],[e,-i],[-e,-i]])I(n,Zt(.02,.015,r,12),t,o,r/2,s+a)}function zi(n,t,e,i,r,s=0,o=0,a=1){const c=I(n,new Me(.2,28,20),t,e,i,r);return c.scale.set(a,a*.95,a*.4),c.rotation.order="YXZ",c.rotation.y=s,c.rotation.x=o,c}const Fs=n=>new Pe({color:$t(n%3===0?"#3C6B4A":n%3===1?"#2F5A3D":"#28503A"),roughness:.4}),jm=(n,t,e)=>{const i=t.shape,r=vn(t.fabric,t.color),s=Se(e.metal),o=vn("linen",e.accent),a=vn("linen",e.light);if(i==="curved"||i==="channel"){const p=Math.asin(.4615384615384615),d=Gt/2-p,_=Gt/2+p,g=new Ze;g.position.set(0,0,2.6),n.add(g),I(g,mn(2.6-.84,2.6-.06,d+.02,_-.02,.07),De("#1E1512",.6)),I(g,mn(2.6-.9,2.6,d,_,.3,.035),r,0,.07,0);for(let m=0;m<3;m++)I(g,mn(2.6-.93,2.6-.25,d+(_-d)*m/3+.006,d+(_-d)*(m+1)/3-.006,.16,.045),r,0,.33,0);if(i==="channel"){I(g,mn(2.6-.07,2.6,d,_,.44,.02),r,0,.35,0);for(let m=0;m<13;m++){const f=d+(m+.5)/13*(_-d);I(g,new Ti(.088,.36,8,18),r,(2.6-.15)*Math.cos(f),.628,-2.45*Math.sin(f))}}else I(g,mn(2.6-.27,2.6,d,_,.48,.06),r,0,.35,0);for(const[m,f,x]of[[d+.17,o,.12],[_-.2,a,-.1]])zi(g,f,(2.6-.4)*Math.cos(m),.66,-2.2*Math.sin(m),m+Gt/2+x,.28);return}if(i==="modular"){for(const u of[-.8,0,.8])I(n,vt(.79,.95,.38,.09,.06),r,u,0,.475),I(n,vt(.79,.3,.36,.11,.08),r,u,.36,.16);zi(n,o,-.75,.58,.48,.3,-.2,.9),zi(n,a,.85,.58,.48,-.2,-.2,.9);return}if(i==="daybed"){const u=ze(e.wood,.45);I(n,vt(2.4,.95,.06,.02,.01),u,0,.2,.475);for(const[p,d]of[[1.12,.08],[-1.12,.08],[1.12,.87],[-1.12,.87]])I(n,qt(.06,.2,.06),u,p,.1,d);I(n,vt(2.34,.9,.2,.07,.05),r,0,.26,.475);for(const p of[-1.02,1.02])I(n,new Ti(.1,.62,8,18),r,p,.56,.475).rotation.x=Gt/2;[-.6,0,.6].forEach((p,d)=>{I(n,vt(.52,.16,.4,.07,.055),d===1?o:r,p,.46,.12).rotation.x=-.16});return}const c=i==="tuxedo",l=c?.46:.3,h=c?.46:.5;if(Ai(n,s,1.1,.375,.11,.475),I(n,vt(2.4,.95,.25,.05,.03),r,0,.11,.475),I(n,vt(2.4,.2,h,.06,.04),r,0,.33,.1),i==="rolled"){for(const u of[-1.08,1.08])I(n,Zt(.16,.16,.93,28),r,u,.5,.475).rotation.x=Gt/2,I(n,vt(.26,.93,.2,.04,.03),r,u,.33,.475);I(n,Zt(.11,.11,2.36,28),r,0,.83,.1).rotation.z=Gt/2}else for(const u of[-1.1,1.1])I(n,vt(.2,.95,l,.06,.04),r,u,.33,.475);if(c){I(n,vt(1.98,.72,.16,.05,.04),r,0,.34,.57);for(const u of[-.74,-.25,.25,.74])I(n,vt(.46,.14,.3,.06,.05),r,u,.49,.28).rotation.x=-.1}else{for(const u of[-.66,0,.66])I(n,vt(.65,.7,.16,.05,.04),r,u,.34,.58),I(n,vt(.63,.17,.36,.07,.055),r,u,.49,.3).rotation.x=-.14;zi(n,o,-.78,.7,.42,.25,-.25),zi(n,a,.8,.7,.42,-.2,-.25)}i==="chaise"&&(I(n,vt(.84,.66,.25,.05,.03),r,.78,.11,1.26),I(n,vt(.8,.64,.16,.05,.04),r,.78,.34,1.25))},$m=(n,t,e)=>{const i=t.shape,r=vn(t.fabric,t.color),s=Se(e.metal);if(i==="tub"||i==="channelt"){for(const[c,l]of[[.22,.22],[-.22,.22],[.22,-.22],[-.22,-.22]])I(n,Zt(.02,.014,.14,14),s,c,.07,l);I(n,Oe([[0,0],[.33,0],[.365,.03],[.375,.2],[.36,.26],[0,.26]]),r,0,.14,0),I(n,Oe([[0,0],[.26,0],[.3,.03],[.305,.08],[.27,.12],[0,.125]]),r,0,.37,.02);const o=-Gt/2+.95,a=Gt*1.5-.95;if(i==="channelt"){I(n,mn(.35,.385,o,a,.42,.015),r,0,.36,0);for(let c=0;c<12;c++){const l=o+(c+.5)/12*(a-o);I(n,new Ti(.052,.3,6,14),r,.315*Math.cos(l),.57,-.315*Math.sin(l))}}else I(n,mn(.255,.385,o,a,.46,.05),r,0,.36,0)}else if(i==="club"||i==="wing"){Ai(n,s,.3,.3,.1),I(n,vt(.78,.78,.26,.06,.04),r,0,.1,0);for(const o of[-.31,.31])I(n,vt(.16,.78,.3,.06,.04),r,o,.34,0);if(I(n,vt(.78,.18,i==="wing"?.68:.44,.07,.05),r,0,.34,-.3),I(n,vt(.46,.56,.14,.05,.04),r,0,.35,.07),i==="wing")for(const o of[-.34,.34])I(n,vt(.1,.3,.38,.04,.03),r,o,.64,-.12)}else if(i==="slipper")Ai(n,s,.26,.28,.1),I(n,vt(.64,.68,.26,.07,.05),r,0,.1,0),I(n,vt(.64,.16,.48,.07,.05),r,0,.3,-.27).rotation.x=-.15;else{for(const o of[-.31,.31])I(n,qt(.02,.02,.72),s,o,.01,0),I(n,qt(.02,.58,.02),s,o,.29,.35),I(n,qt(.02,.82,.02),s,o,.41,-.35),I(n,qt(.02,.02,.72),s,o,.58,0);I(n,vt(.6,.62,.05,.02,.015),r,0,.33,.02).rotation.x=.12,I(n,vt(.6,.05,.5,.02,.015),r,0,.36,-.3).rotation.x=-.2}},Qm=(n,t,e)=>{const i=t.shape,r=()=>ze(t.color,.35),s=Se(e.metal),o=(c,l,h,u,p,d=0,_=0,g=r())=>{I(n,Oe([[0,0],[c-.02,0],[c,.012],[c,p-.012],[c-.02,p],[0,p]],64),g,d,l,_).scale.set(h,1,u)},a=(c,l,h,u)=>I(n,Oe([[0,0],[c-.015,0],[c,.015],[c,l-.015],[c-.015,l],[0,l]],56),ve(t.color,.3),h,0,u);if(i==="oval")o(.52,.354,1.06,.6,.046),I(n,Zt(.1,.12,.355,32),r(),-.26,.1775,0),I(n,Zt(.1,.12,.355,32),r(),.26,.1775,0);else if(i==="ovalframe"){o(.5,.382,1.08,.6,.02,0,0,fo("#4A3F38",.5));for(const[c,l,h]of[[.5,.38,.013],[.36,.12,.009]]){const u=I(n,new tr(c,h,12,80),s,0,l,0);u.rotation.x=Gt/2,u.scale.set(1.08,.6,1)}for(const[c,l]of[[.4,.14],[-.4,.14],[.4,-.14],[-.4,-.14]])I(n,Zt(.011,.011,.38,12),s,c,.19,l)}else if(i==="drums")a(.345,.38,-.2,0),a(.235,.3,.36,.08);else if(i==="round")o(.44,.36,1,1,.045),I(n,Oe([[0,0],[.26,0],[.27,.02],[.1,.08],[.08,.3],[.14,.36],[0,.36]],40),r(),0,0,0);else if(i==="rect"){I(n,vt(1.1,.6,.05,.03,.01),r(),0,.35,0);for(const[c,l]of[[.5,.25],[-.5,.25],[.5,-.25],[-.5,-.25]])I(n,qt(.05,.35,.05),r(),c,.175,l);I(n,vt(1,.5,.02,.02,.005),r(),0,.1,0)}else if(i==="plinth")I(n,vt(.96,.56,.05,.02,.005),De("#1E1512",.6)),I(n,vt(1.04,.62,.31,.03,.015),r(),0,.05,0);else if(i==="nest"){o(.36,.385,1,1,.025,-.18,0),o(.26,.295,1,1,.025,.36,.1);for(let c=0;c<3;c++){const l=c*2.094;I(n,Zt(.009,.009,.385,10),s,-.18+Math.cos(l)*.3,.1925,Math.sin(l)*.3),I(n,Zt(.009,.009,.295,10),s,.36+Math.cos(l+1)*.21,.1475,.1+Math.sin(l+1)*.21)}}else{o(.42,.36,1.1,.62,.04,-.16,0),o(.33,.36,1,.72,.04,.26,.08);for(const[c,l]of[[-.42,0],[.38,.1],[0,-.12]])I(n,Zt(.03,.02,.36,16),r(),c,.18,l)}},t0=(n,t,e)=>{const i=t.shape,r=()=>ze(t.color,.38),s=Se(e.metal),o=(a,c,l)=>I(n,Oe([[0,0],[a-.01,0],[a,.01],[a,l-.008],[a-.01,l],[0,l]],48),r(),0,c,0);if(i==="tripod"){o(.22,.466,.034);for(let a=0;a<3;a++){const c=a*2.094+.5,l=I(n,Zt(.011,.009,.5,12),s,Math.cos(c)*.12,.235,Math.sin(c)*.12);l.rotation.order="YXZ",l.rotation.y=-c,l.rotation.z=-.22}}else if(i==="drum")I(n,Oe([[0,0],[.185,0],[.2,.015],[.2,.485],[.185,.5],[0,.5]],48),ve(t.color,.3));else if(i==="ctable"){I(n,vt(.38,.36,.03,.015,.005),r(),0,.47,0);for(const a of[-.15,.15])I(n,qt(.02,.47,.02),s,.17,.235,a),I(n,qt(.34,.015,.02),s,.01,.0075,a)}else if(i==="cube")I(n,vt(.38,.38,.5,.025,.012),r());else if(i==="discs")for(const[a,c]of[[.2,0],[.13,.17],[.2,.33]])I(n,Oe([[0,0],[a-.02,0],[a,.03],[a,.14],[a-.02,.17],[0,.17]],44),r(),0,c,0);else o(.21,.46,.04),I(n,Zt(.016,.016,.45,16),s,0,.235,0),I(n,Zt(.15,.16,.014,40),s,0,.007,0)},e0=(n,t,e)=>{const i=t.shape,r=ze(t.color,.45),s=Se(e.metal),o=.8,a=2,c=.35,l=.026,h=xn(77),u=ve(e.accent,.3),p=4,d=(a-.063)/p,_=Array.from({length:p},(v,A)=>.063+A*d);let g;if(i==="credenza"){Ai(n,s,.34,.12,.08,.19),I(n,vt(.8,.38,.68,.015,.006),r,0,.08,.19),I(n,qt(.004,.62,.004),De("#1E1512",.6),0,.42,.382,!0);for(const v of[1.2,1.55,1.9])I(n,qt(.8,.03,.24),r,0,v,.12);g=[.762,1.217,1.567]}else{if(i==="etagere"){for(const[v,A]of[[-.39,.01],[.39,.01],[-.39,.34],[.39,.34]])I(n,qt(.02,a,.02),s,v,a/2,A);for(const v of[..._,a-.015])I(n,qt(o-.04,.03,c-.02),r,0,v,c/2)}else{I(n,qt(o,a,.014),r,0,a/2,.007);for(const v of[-o/2+l/2,o/2-l/2])I(n,qt(l,a,c),r,v,a/2,c/2);for(const v of[..._,a-l/2])I(n,qt(o-2*l,l,c-.01),r,0,v,c/2);if(i==="arch"){const v=_i(-o/2,0,o,a),A=new Zi;A.moveTo(-.33,.1),A.lineTo(-.33,a-.45),A.absarc(0,a-.45,.33,Gt,0,!0),A.lineTo(.33,.1),A.closePath(),v.holes.push(A),I(n,new Pn(v,{depth:.02,bevelEnabled:!1,curveSegments:28}),r,0,0,c-.01),I(n,qt(o-2*l-.01,a-.1,.006),u,0,a/2,.018,!0)}else I(n,qt(o-2*l-.01,d-l-.01,.006),u,0,_[1]+d/2,.018,!0)}g=_.map(v=>v+.015)}const m=[e.accent,e.seating,e.light,Oc(t.color,.3),e.metal],f=i==="credenza"?.12:.16,x=i==="arch"?.78:1;g.forEach((v,A)=>{let N=-.34*x;const w=A%2?5:8;for(let R=0;R<w;R++){const C=.026+h()*.03,S=Math.min(d-.08,.2+h()*.1);I(n,qt(C,S,.15+h()*.04),ve(m[Math.floor(h()*m.length)],.7),N+C/2,v+S/2,f),N+=C+.003}A%2&&I(n,Oe([[0,0],[.045,0],[.075,.07],[.07,.15],[.03,.22],[.038,.26],[0,.26]],30),ve(A===1?e.accent:e.light,.25),.2*x,v,f).scale.setScalar(Math.min(1,(d-.06)/.26))})},n0=(n,t,e)=>{const i=t.shape,r=Se(e.metal),s=()=>ze(t.color,.4);if(i==="waterfall"){I(n,vt(.95,.35,.045,.01,.004),s(),0,.805,0);for(const o of[-.4525,.4525])I(n,vt(.045,.35,.81,.01,.004),s(),o,0,0)}else if(i==="demilune"){const o=I(n,mn(.001,.46,0,Gt,.04,.005),s(),0,.81,-.175);o.rotation.y=Gt;for(const[a,c]of[[-.38,-.15],[.38,-.15],[0,.2]])I(n,Zt(.016,.01,.81,14),r,a,.405,c)}else if(i==="plinth")I(n,vt(.89,.31,.06,.01,.003),De("#1E1512",.6)),I(n,vt(.95,.35,.79,.02,.01),s(),0,.06,0),I(n,qt(.004,.7,.004),De("#1E1512",.6),0,.45,.176,!0);else if(i==="trestle"){I(n,vt(.95,.35,.04,.012,.006),s(),0,.81,0);for(const o of[-.33,.33])[-.1,.1].forEach((a,c)=>{I(n,Zt(.012,.012,.83,12),r,o,.405,a).rotation.x=c?-.07:.07}),I(n,qt(.014,.014,.22),r,o,.3,0)}else{I(n,vt(.95,.35,.04,.012,.006),s(),0,.81,0),I(n,vt(.89,.31,.13,.008,.004),s(),0,.68,0);for(const o of[-.22,.22])I(n,new Me(.014,14,10),r,o,.745,.165);for(const[o,a]of[[.42,.13],[-.42,.13],[.42,-.13],[-.42,-.13]])I(n,Zt(.014,.01,.68,14),r,o,.34,a)}},i0=(n,t,e)=>{const i=t.shape,r=vn(t.fabric,t.color),s=ze(e.wood,.45),o=1.7,a=2.1;if(i==="platform")I(n,vt(o+.2,a+.1,.18,.02,.008),s,0,.06,0),I(n,vt(o+.2,.06,.7,.02,.008),s,0,.24,-a/2),Ai(n,s,o/2,a/2-.05,.06);else if(I(n,vt(o+.08,a+.06,.3,.04,.02),r,0,.04,0),i==="curvedhead"){const l=I(n,new Pn(Wi(o+.1,.55,-.9),{depth:.1,bevelEnabled:!0,bevelSize:.02,bevelThickness:.02,bevelSegments:3,curveSegments:28}),r,0,.1,-a/2-.08);l.scale.y=.75}else if(i==="channelhead"){I(n,vt(o+.1,.06,1,.03,.015),r,0,.1,-a/2-.03);for(let l=0;l<9;l++)I(n,new Ti(.085,.72,6,14),r,-o/2+.1+l*((o-.2)/8),.68,-a/2+.06)}else I(n,vt(o+.1,.12,1.05,.06,.04),r,0,.1,-a/2-.04);const c=i==="platform"?.24:.34;I(n,vt(o,a-.06,.22,.08,.05),ve("#F3EEE6",.9),0,c,.02),I(n,vt(o+.04,a*.62,.06,.06,.03),$s(e.light),0,c+.2,a*.17),I(n,vt(o+.05,.55,.05,.05,.025),$s(e.accent),0,c+.25,a/2-.36);for(const l of[-o/4,o/4])I(n,vt(.66,.42,.14,.09,.06),ve("#F6F2EA",.9),l,c+.2,-a/2+.32).rotation.x=.18},r0=(n,t)=>{const e=()=>ze(t.color,.38);if(t.shape==="round")I(n,Oe([[0,0],[.58,0],[.6,.012],[.6,.038],[.58,.05],[0,.05]],64),e(),0,.7,0),I(n,Oe([[0,0],[.34,0],[.35,.03],[.09,.1],[.07,.62],[.16,.7],[0,.7]],40),e());else if(t.shape==="oval"){I(n,Oe([[0,0],[.58,0],[.6,.012],[.6,.038],[.58,.05],[0,.05]],64),e(),0,.7,0).scale.set(1.6,1,.8);for(const r of[-.5,.5])I(n,Zt(.11,.16,.7,32),e(),r,.35,0)}else{I(n,vt(1.8,.9,.05,.02,.008),e(),0,.7,0);for(const[i,r]of[[.82,.38],[-.82,.38],[.82,-.38],[-.82,-.38]])I(n,qt(.07,.7,.07),e(),i,.35,r)}},s0=(n,t,e)=>{const i=ze(t.color,.45),r=vn("linen",e.light);for(const[s,o]of[[.19,.19],[-.19,.19],[.19,-.19],[-.19,-.19]])I(n,Zt(.018,.014,.45,12),i,s,.225,o);if(I(n,vt(.46,.46,.07,.06,.03),r,0,.44,0),t.shape==="curvedback")I(n,mn(.2,.235,.35,Gt-.35,.36,.012),i,0,.5,.02);else{for(const s of[-.19,.19])I(n,Zt(.016,.016,.42,12),i,s,.66,-.2);I(n,vt(.44,.03,.2,.012,.006),i,0,.68,-.2)}},o0=(n,t,e)=>{const i=()=>ze(t.color,.4),r=Se(e.metal);if(I(n,vt(1.4,.65,.04,.012,.006),i(),0,.71,0),t.shape==="trestle")for(const s of[-.5,.5])[-.22,.22].forEach((o,a)=>{I(n,Zt(.014,.014,.73,12),r,s,.355,o).rotation.x=a?-.1:.1}),I(n,qt(.014,.014,.4),r,s,.3,0);else{I(n,vt(1.3,.55,.1,.008,.004),i(),0,.61,0);for(const[s,o]of[[.64,.27],[-.64,.27],[.64,-.27],[-.64,-.27]])I(n,Zt(.02,.014,.62,14),r,s,.31,o)}},a0=(n,t,e)=>{I(n,vt(1.7,.4,.05,.01,.003),De("#1E1512",.6)),I(n,vt(1.8,.45,.45,.015,.006),ze(t.color,.4),0,.05,0);for(const i of[-.45,0,.45])I(n,qt(.004,.38,.004),De("#1E1512",.6),i,.28,.226,!0);for(const i of[-.5,.5])I(n,new Me(.012,12,8),Se(e.metal),i,.3,.232)},c0=(n,t,e)=>{I(n,vt(1.76,.56,.06,.01,.003),De("#1E1512",.6)),I(n,vt(1.8,.6,2.14,.012,.006),ze(t.color,.45),0,.06,0);for(const i of[-.45,0,.45])I(n,qt(.004,2.04,.004),De("#1E1512",.6),i,1.13,.301,!0);for(const i of[-.5,-.4,.4,.5])I(n,Zt(.008,.008,.3,10),Se(e.metal),i,1.1,.315)},l0=(n,t,e)=>{if(t.shape==="pouf"){I(n,Oe([[0,0],[.25,0],[.3,.06],[.31,.3],[.27,.38],[0,.4]],48),vn(t.fabric??"boucle",t.color));return}Ai(n,Se(e.metal),.52,.16,.3),I(n,vt(1.2,.42,.14,.06,.04),vn(t.fabric,t.color),0,.3,0)},h0=(n,t,e,i)=>{const r=t.shape,s=Se(t.color),o=e.light,a=()=>new Pe({color:$t(o),roughness:.92,side:Ne,emissive:$t("#FFB978"),emissiveIntensity:i?.8:.12,bumpMap:Li(),bumpScale:.002}),c=()=>new Pe({color:$t(t.color),roughness:.34,metalness:1,side:Ne});if(r==="column"){I(n,vt(.3,.3,.04,.02,.008),s),I(n,Zt(.125,.125,1.2,40),new Pe({color:$t("#F4EBDB"),roughness:.95,emissive:$t("#FFC98A"),emissiveIntensity:i?.9:.25}),0,.64,0,!0);return}if(r==="tripod"){const l=ze(e.wood,.45);for(let h=0;h<3;h++){const u=h*2.094+.4,p=I(n,Zt(.014,.018,1.22,12),l,Math.cos(u)*.14,.59,Math.sin(u)*.14);p.rotation.order="YXZ",p.rotation.y=-u,p.rotation.z=-.23}I(n,new xi(.17,.22,.3,44,1,!0),a(),0,1.4,0),I(n,new Me(.04,14,10),Gi(i),0,1.38,0,!0);return}if(I(n,Zt(.15,.16,.022,40),s,0,.011,0),r==="arc"){I(n,Zt(.012,.012,1.5,14),s,0,.75,0),I(n,new tr(.55,.012,10,48,Gt*.72),s,-.55,1.5,0);const l=-.55+.55*Math.cos(Gt*.72),h=1.5+.55*Math.sin(Gt*.72),u=I(n,new Me(.17,40,20,0,Gt*2,0,Gt/2),c(),l-.03,h-.2,0);u.receiveShadow=!1,I(n,new Me(.045,16,12),Gi(i),l-.03,h-.16,0,!0);return}I(n,Zt(.011,.011,r==="torch"?1.6:1.36,14),s,0,r==="torch"?.82:.7,0),r==="torch"?(I(n,new xi(.17,.04,.16,40,1,!0),c(),0,1.68,0),I(n,Zt(.12,.12,.008,30),Gi(i,.8),0,1.7,0,!0)):r==="globe"?I(n,new Me(.14,40,28),new Pe({color:$t("#FFF3DE"),roughness:.35,emissive:$t("#FFC98A"),emissiveIntensity:i?1.5:.45}),0,1.5,0,!0):(I(n,new xi(.14,.21,.28,44,1,!0),a(),0,1.47,0),I(n,new Me(.04,14,10),Gi(i),0,1.44,0,!0))},u0=(n,t)=>{const e=t.shape,i=xn(5),r=De("#4A3A2A",.8);if(I(n,Oe([[0,0],[.13,0],[.17,.05],[.19,.34],[.175,.36],[.165,.33],[0,.33]],40),ve(t.color,.5)),I(n,Zt(.16,.16,.01,30),ve("#2A1F18",1),0,.325,0),e==="snake")for(let s=0;s<16;s++){const o=i()*6.283,a=i()*.1,c=.5+i()*.55,l=I(n,new Me(.5,12,14),Fs(s),Math.cos(o)*a,.33+c/2,Math.sin(o)*a);l.scale.set(.085,c,.02),l.rotation.set((i()-.5)*.3,o,(i()-.5)*.3)}else if(e==="palm")for(let s=0;s<9;s++){const o=s*.7+i()*.3,a=.25+i()*.35,c=.9+i()*.5,l=Math.cos(o),h=Math.sin(o),u=I(n,Zt(.006,.009,c,6),De("#5C7A4A",.7),l*Math.sin(a)*c/2,.33+Math.cos(a)*c/2,h*Math.sin(a)*c/2);u.rotation.order="YXZ",u.rotation.y=-o,u.rotation.z=-a;const p=I(n,new Me(.5,14,10),Fs(s),l*Math.sin(a)*(c+.12),.33+Math.cos(a)*c+.02,h*Math.sin(a)*(c+.12));p.scale.set(.62,.03,.22),p.rotation.order="YXZ",p.rotation.y=-o,p.rotation.z=-.5+a}else if(e==="olive"){I(n,Zt(.014,.024,1.15,10),r,0,.905,0);for(let s=0;s<90;s++){const o=i()*6.283,a=Math.pow(i(),.6)*.34,c=1.3+i()*.6,l=1-Math.abs(c-1.6)*.8,h=I(n,new Me(.05,8,6),De(s%2?"#7F8F72":"#6B7C60",.6),Math.cos(o)*a*l,c,Math.sin(o)*a*l);h.scale.set(1,.22,.4),h.rotation.set(i()*3,i()*6,i()*3)}}else[[0,0,1.25,.02],[.05,.04,.95,-.12],[-.05,-.03,.8,.14]].forEach((s,o)=>{I(n,Zt(.011,.016,s[2],8),r,s[0],.33+s[2]/2,s[1]).rotation.z=s[3];const a=o===0?11:7;for(let c=0;c<a;c++){const l=.45+c/a*(s[2]-.2)+.33,h=.13+i()*.05,u=c*2.4+o,p=I(n,new Me(.12,14,10),Fs(c),s[0]-Math.sin(s[3])*(l-.33)+Math.cos(u)*h,l,s[1]+Math.sin(u)*h);p.scale.set(1.05,.07,.56),p.rotation.order="YXZ",p.rotation.y=-u,p.rotation.z=.5+i()*.3}})},f0=(n,t,e)=>{const i=ze(t.color,.28),r=Se(e.metal);I(n,vt(1.5,.35,1.25,.02,.008),i,0,0,-.125),I(n,vt(1.54,.39,.03,.01,.005),i,0,1.25,-.115),I(n,vt(1.46,.28,.1,.015,.006),i,0,.62,.17),I(n,qt(1.24,.014,.15),ve("#F4EFE4",.25),0,.726,.22);for(let s=0;s<51;s++){const o=s%7;o===2||o===6||I(n,qt(.012,.014,.09),ve("#17120F",.3),-.608+s*.0238,.738,.19,!0)}for(const s of[-.69,.69])I(n,qt(.07,.62,.07),i,s,.31,.26);for(const s of[-.1,0,.1])I(n,qt(.03,.012,.09),r,s,.07,.1)},Hc=(n,t)=>{I(n,vt(1,1,1,.03,.015),ze(t.color,.5))},d0={sofa:jm,chair:$m,table:Qm,side:t0,shelf:e0,console:n0,bed:i0,dining:r0,dchair:s0,desk:o0,media:a0,wardrobe:c0,bench:l0,lamp:h0,plant:u0,piano:f0,other:Hc},p0=new Set(["lamp","plant","side","dchair","chair"]);function m0(n,t,e){const i=new Ze;if(i.userData.id=n.id,i.position.set(n.cx,0,n.cz),i.rotation.y=n.rot,n.category==="rug"){const p=new Pe({map:Wm(),color:uo(n.color),roughness:1,bumpMap:Li(),bumpScale:.004});if(n.shape==="rect"){const d=new Ye(n.w,n.d);d.rotateX(-Gt/2),I(i,d,p,0,.012,0,!0)}else{const d=new Yr(.5,72);d.rotateX(-Gt/2);const _=I(i,d,p,0,.012,0,!0),g=n.shape==="round"?Math.min(n.w,n.d):0;_.scale.set(g||n.w,1,g||n.d)}return i}const r=new Ze;(d0[n.category]??Hc)(r,n,t,e);const s=new Un().setFromObject(r),o=s.getSize(new P),a=s.getCenter(new P);r.position.set(-a.x,-s.min.y,-a.z);const c=new Ze;let l=n.w/Math.max(.01,o.x),h=n.d/Math.max(.01,o.z);p0.has(n.category)&&(l=h=Math.min(l,h));const u=n.category==="other"||n.category==="piano"||n.category==="shelf"||n.category==="wardrobe"?n.h/Math.max(.01,o.y):Math.max(.8,Math.min(1.25,Math.sqrt(l*h)));return c.scale.set(l,u,h),c.add(r),i.add(c),i}function _0(n,t){return{A:{len:n,at:(e,i,r)=>new P(e,i,r),ry:0,sign:1},C:{len:n,at:(e,i,r)=>new P(e,i,t-r),ry:Gt,sign:-1},D:{len:t,at:(e,i,r)=>new P(r,i,e),ry:Gt/2,sign:-1},B:{len:t,at:(e,i,r)=>new P(n-r,i,e),ry:-Gt/2,sign:1}}}function g0(n,t){return n.kind==="door"&&n.arched?Wi(n.width,n.head-n.width/2,t-n.width/2):_i(t-n.width/2,n.sill,n.width,n.head-n.sill)}function v0(n,t,e){const{w:i,l:r,h:s}=t.room,o=_0(i,r),a=t.surfaces,c=ve("#EFEAE2",.5),l=new Ze;n.add(l),I(l,qt(i+.5,.14,r+.5),ve("#D8CEC6",.9),i/2,-.071,r/2,!0);const h=I(l,new Ye(i,r),ve("#F1ECE5",.95),i/2,s,r/2,!0);h.rotation.x=Gt/2;const u=km(),p=new Ye(r,i);p.rotateX(-Gt/2);const d=new Pe({map:u,roughness:.42,color:uo(a.floor)}),_=I(l,p,d,i/2,0,r/2,!0);_.rotation.y=Gt/2,_.userData.id="floor",u.repeat.set(r/2,i/2);const g=ve(Hm(a.wall,.35),.6);for(const m of["A","B","C","D"]){const f=o[m],x=new Ze;x.position.copy(f.at(f.len/2,0,0)),x.rotation.y=f.ry,x.userData.wall=m,x.userData.id="walls",l.add(x);const v=C=>f.sign*(C-f.len/2),A=t.openings.filter(C=>C.wall===m),N=_i(-f.len/2,0,f.len,s);for(const C of A)N.holes.push(g0(C,v(C.at)));I(x,new Fr(N,24),new Pe({color:$t(a.wall),map:ja(),bumpMap:ja(),bumpScale:.006,roughness:.93}),0,0,0,!0);const w=A.filter(C=>C.kind==="door").map(C=>[v(C.at)-C.width/2-.1,v(C.at)+C.width/2+.1]).sort((C,S)=>C[0]-S[0]);let R=-f.len/2;for(const[C,S]of[...w,[f.len/2,f.len/2]])C-R>.05&&I(x,qt(C-R,.09,.016),g,(C+R)/2,.045,.008,!0),R=Math.max(R,S);for(const C of A){const S=v(C.at),E=new Ze;if(E.position.set(S,0,0),x.add(E),C.kind==="window"){const D=C.head-C.sill,B=_i(-C.width/2,0,C.width,D),z=new Zi;z.moveTo(-C.width/2+.055,.055),z.lineTo(C.width/2-.055,.055),z.lineTo(C.width/2-.055,D-.055),z.lineTo(-C.width/2+.055,D-.055),z.closePath(),B.holes.push(z),E.userData.pick=`window-${C.id}`,I(E,new Pn(B,{depth:.22,bevelEnabled:!1}),c,0,C.sill,-.22).userData.id=`window-${C.id}`,I(E,qt(.05,D-.1,.05),c,0,C.sill+D/2,-.12),I(E,new Ye(C.width-.1,D-.1),fo("#DCEBF2",.12),0,C.sill+D/2,-.13,!0),I(E,qt(C.width+.12,.035,.16),c,0,C.sill-.015,.06);const b=new Yn({map:Xm(e)});b.color.setRGB(e?.5:1.7,e?.5:1.7,e?.6:1.7),I(E,new Ye(C.width+1.6,D+1.2),b,0,C.sill+D/2,-.75,!0).userData.id="sky"}else{const D=ve(a.door,.36);if(E.userData.id="doors",C.arched){const b=Wi(C.width+.18,C.head-C.width/2,-C.width/2-.09);b.holes.push(Wi(C.width,C.head-C.width/2,-C.width/2)),I(E,new Pn(b,{depth:.13,bevelEnabled:!1,curveSegments:28}),D,0,0,-.11),I(E,new Fr(Wi(C.width,C.head-C.width/2,-C.width/2),28),ve(a.door,.32),0,0,-.09,!0)}else{const b=_i(-C.width/2-.07,0,C.width+.14,C.head+.07);b.holes.push(_i(-C.width/2,0,C.width,C.head)),I(E,new Pn(b,{depth:.13,bevelEnabled:!1}),c,0,0,-.11),I(E,new Ye(C.width,C.head),D,0,C.head/2,-.07,!0)}const B=ve(Oc(a.door,.2),.36),z=C.width-.28;I(E,qt(z,.62,.012),B,0,.52,-.064,!0),I(E,qt(z,Math.max(.3,C.head-(C.arched?C.width/2:0)-1.1),.012),B,0,.98+Math.max(.3,C.head-(C.arched?C.width/2:0)-1.1)/2,-.064,!0),I(E,new Me(.03,20,14),Se(a.metal),C.width/2-.14,1.02,-.03)}}for(const C of t.radiators.filter(S=>S.wall===m)){const S=Math.round(C.width/.1);for(let E=0;E<S;E++)I(x,vt(.075,.07,.4,.02,.008),c,v(C.at)-C.width/2+.05+E*.1,.2,.075)}}return o}function x0(n,t,e,i){const r=t.surfaces,s=t.room.h;for(const o of t.extras){const a=e[o.wall],c=new Ze;if(c.userData.id=o.id,c.userData.wall=o.wall,n.add(c),o.kind==="pendant"){c.userData.wall=void 0;const l=t.pieces.find(_=>_.category==="dining")??t.pieces.find(_=>_.category==="table")??t.pieces.find(_=>_.category==="bed"),h=(l==null?void 0:l.cx)??t.room.w/2,u=(l==null?void 0:l.cz)??t.room.l/2,p=Se(o.color),d=De("#2A211C",.6);I(c,Zt(.16,.16,.02,40),p,h,s-.01,u,!0);for(const[_,g,m]of[[-.3,.06,s-.72],[.04,-.12,s-.98],[.31,.1,s-.6]])I(c,Zt(.004,.004,s-m-.14,6),d,h+_,(s+m+.14)/2,u+g,!0),I(c,Zt(.03,.036,.07,20),p,h+_,m+.135,u+g),I(c,new Me(.035,16,12),Gi(i),h+_,m,u+g,!0),I(c,new Me(.115,40,28),fo("#FFF4E0",.22),h+_,m,u+g,!0);continue}if(c.rotation.y=a.ry,o.kind==="curtains"){const l=vn("linen",o.color);l.side=Ne,c.position.copy(a.at(a.len/2,0,0));const h=u=>a.sign*(u-a.len/2);for(const u of t.openings.filter(p=>p.wall===o.wall&&p.kind==="window")){const p=Math.min(s-.12,u.head+.22),d=p-.03;for(const _ of[-1,1]){const g=new Ye(.56,d,48,10),m=g.attributes.position;for(let f=0;f<m.count;f++){const x=m.getX(f),v=m.getY(f),A=x/.56+.5,N=.55+.45*((v+d/2)/d);m.setZ(f,Math.sin(A*Gt*11)*.04*(1.15-N*.3)),m.setX(f,x*(.9+.1*N))}g.computeVertexNormals(),I(c,g,l,h(u.at)+_*(u.width/2+.12),.03+d/2,.11)}I(c,Zt(.012,.012,u.width+1,14),Se(r.metal),h(u.at),p+.02,.11).rotation.z=Gt/2}continue}c.position.copy(a.at(Math.max(.6,Math.min(a.len-.6,o.at)),o.y,0)),o.kind==="mirror"?(I(c,new Yr(.39,64),new Pe({color:$t("#E4EAEE"),roughness:.03,metalness:1}),0,0,.016,!0),I(c,new tr(.395,.014,16,96),Se(o.color),0,0,.02)):(I(c,qt(1,.7,.03),Se(r.metal),0,0,.017),I(c,new Ye(.94,.64),new Pe({map:qm([o.color,r.seating,r.light,r.metal],o.wall.charCodeAt(0)),roughness:.85}),0,0,.034,!0))}}function po(n,t){const{w:e,l:i,h:r}=n.room,s=n.surfaces,o=new Ha;o.background=$t("#EFE7E1");const a=v0(o,n,t),c={wood:s.wood,metal:s.metal,accent:s.accent,light:s.light,seating:s.seating};for(const w of n.pieces)o.add(m0(w,c,t));x0(o,n,a,t);const l=new Nm($t("#FFF4E4"),$t("#5A4A3C"),t?.07:.34);o.add(l);const h=n.openings.find(w=>w.kind==="window"),u=a[(h==null?void 0:h.wall)??"C"],p=u.at((h==null?void 0:h.at)??u.len/2,0,-3.2),d=u.at((h==null?void 0:h.at)??u.len/2,0,Math.min(e,i)*.7),_=new zm($t("#FFF1DC"),t?0:1.55);_.position.set(p.x,r+1.7,p.z),_.target.position.set(d.x,0,d.z),o.add(_),o.add(_.target),_.castShadow=!0,_.shadow.mapSize.set(2048,2048);const g=Math.max(e,i)*.85+1;Object.assign(_.shadow.camera,{left:-g,right:g,top:g,bottom:-g,near:.5,far:g*3+8}),_.shadow.bias=-6e-4,_.shadow.normalBias=.03;const m=[],f=(w,R,C,S,E,D=!1)=>{const B=new Om($t("#FFC98A"),t?E:S,Math.max(6.5,Math.max(e,i)*1.3),1.6);B.position.set(w,R,C),D&&(B.castShadow=!0,B.shadow.mapSize.set(1024,1024),B.shadow.bias=-.003),o.add(B),m.push(B)};f(e/2,r-.75,i/2,.35,2.3,!0);for(const w of n.pieces.filter(R=>R.category==="lamp").slice(0,2))f(w.cx,1.42,w.cz,.22,1.5);const x=new Ha,v=new en(qt(10,6,10),new Yn({side:Le}));v.material.color.setRGB(.42,.4,.37),x.add(v);const A=(w,R,C,S,E,D,B,z,b)=>{const U=new en(new Ye(w,R),new Yn({side:Ne}));U.material.color.setRGB(B,z,b),U.position.set(C,S,E),U.rotation.y=D,x.add(U)};A(2.6,2,0,.3,4.9,Gt,5,5.2,5.6),A(1.4,1.4,-4.9,.6,0,Gt/2,2.2,1.8,1.3),A(1.2,1.2,4.9,.8,-1,-Gt/2,2.4,2,1.5);const N=t?.22:1;return o.traverse(w=>{const R=w.material;R&&"envMapIntensity"in R&&(R.envMapIntensity=N)}),{scene:o,envScene:x,sun:_,hemi:l,points:m}}function Qs(n,t,e=1.5){const{w:i,l:r,h:s}=t,o=l=>l*180/Gt,a=(l,h)=>Math.max(34,Math.min(78,o(2*Math.atan(Math.max(s/2+.15,l/2/e)/h)))),c=Math.max(i,r);switch(n){case"A":return{p:[i/2,1.4,r-.3],t:[i/2,1.28,0],f:a(i,r-.3),mode:"look",hide:[]};case"C":return{p:[i/2,1.5,.3],t:[i/2,1.25,r],f:a(i,r-.3),mode:"look",hide:[]};case"B":return{p:[.3,1.4,r/2],t:[i,1.25,r/2],f:a(r,i-.3),mode:"look",hide:[]};case"D":return{p:[i-.3,1.4,r/2],t:[0,1.28,r/2],f:a(r,i-.3),mode:"look",hide:[]};case"doll":return{p:[i/2+c*1.25,c*1.25,r/2+c*1.35],t:[i/2,.7,r/2],f:34,mode:"orbit",hide:["B","C"]};case"plan":return{p:[i/2,c*2+1.5,r/2+.01],t:[i/2,0,r/2],f:36,mode:"fixed",hide:["B","C"]};case"walk":return{p:[i/2,1.6,r-.5],t:[i/2,1.5,0],f:68,mode:"look",hide:[]};default:return{p:[i-.6,1.5,r-.4],t:[i*.38,1.05,r*.2],f:60,mode:"look",hide:[]}}}function M0(n,t,e,i=.3){return[Math.max(i,Math.min(e.w-i,n)),Math.max(i,Math.min(e.l-i,t))]}function F0(n,t,e){const i=new Xr({canvas:n,antialias:!0,preserveDrawingBuffer:!0});i.outputColorSpace=he,i.toneMapping=zr,i.useLegacyLights=!0,i.shadowMap.enabled=!0,i.shadowMap.type=Br;const r=new Yi(i),s=new Ie(60,1.5,.08,80),o=new P,a=new P;let c=null,l=null,h=t,u="room",p="look",d=!0,_=0,g=0,m=0,f=!0,x=null;const v=z=>z.scene.traverse(b=>{var q,Z;const U=b;(Z=(q=U.geometry)==null?void 0:q.dispose)==null||Z.call(q);const O=U.material;(Array.isArray(O)?O:O?[O]:[]).forEach(k=>k.dispose())}),A=()=>{const z=Qs(u,h.room).hide;c==null||c.scene.traverse(b=>{b.userData.wall&&(b.visible=!z.includes(b.userData.wall))})},N=(z,b)=>{const U=z.room.w!==h.room.w||z.room.l!==h.room.l||z.room.h!==h.room.h;if(h=z,c&&v(c),c=po(h,b),!l)try{l=r.fromScene(c.envScene,.03).texture}catch{l=null}c.scene.environment=l,i.toneMappingExposure=b?1.3:1,A(),U&&w(u,!0),d=!0},w=(z,b=!1)=>{u=z;const U=Qs(z,h.room,g&&m?g/m:1.5);p=U.mode,A();const O=new P(...U.p),q=new P(...U.t);b?(o.copy(O),a.copy(q),s.fov=U.f,s.updateProjectionMatrix(),x=null):x={p0:o.clone(),t0:a.clone(),f0:s.fov,p:O,t:q,f:U.f,s:performance.now()},d=!0},R=()=>{if(!f)return;_=requestAnimationFrame(R);const z=n.clientWidth,b=n.clientHeight;if(z&&b&&(z!==g||b!==m)&&(g=z,m=b,i.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),i.setSize(z,b,!1),s.aspect=z/b,s.updateProjectionMatrix(),d=!0),x){const U=Math.min(1,(performance.now()-x.s)/800),O=U<.5?2*U*U:1-Math.pow(-2*U+2,2)/2;o.lerpVectors(x.p0,x.p,O),a.lerpVectors(x.t0,x.t,O),s.fov=x.f0+(x.f-x.f0)*O,s.updateProjectionMatrix(),U>=1&&(x=null),d=!0}d&&c&&z&&b&&(s.position.copy(o),s.lookAt(a),i.render(c.scene,s),d=!1)};let C=null;const S=z=>{C={x:z.clientX,y:z.clientY,sx:z.clientX,sy:z.clientY,moved:!1};try{n.setPointerCapture(z.pointerId)}catch{}},E=z=>{if(!C)return;const b=z.clientX-C.x,U=z.clientY-C.y;if(C.x=z.clientX,C.y=z.clientY,Math.abs(z.clientX-C.sx)+Math.abs(z.clientY-C.sy)>5&&(C.moved=!0),!C.moved||p==="fixed"||x)return;const O=p==="look",q=O?a.clone().sub(o):o.clone().sub(a),Z=q.length();let k=Math.atan2(q.x,q.z),J=Math.asin(Math.max(-1,Math.min(1,q.y/Z)));O?(k+=b*.004,J=Math.max(-.9,Math.min(.75,J+U*.003))):(k-=b*.005,J=Math.max(.18,Math.min(1.45,J+U*.004))),q.set(Math.sin(k)*Math.cos(J),Math.sin(J),Math.cos(k)*Math.cos(J)).multiplyScalar(Z),O?a.copy(o).add(q):o.copy(a).add(q),d=!0},D=z=>{const b=C;if(C=null,!b||b.moved||!c)return;const U=n.getBoundingClientRect(),O=new Gm;s.position.copy(o),s.lookAt(a),s.updateMatrixWorld(),O.setFromCamera(new st((z.clientX-U.left)/U.width*2-1,-((z.clientY-U.top)/U.height)*2+1),s);for(const q of O.intersectObjects(c.scene.children,!0)){let Z=!0,k;for(let J=q.object;J;J=J.parent)J.visible||(Z=!1),k??(k=J.userData.id);if(Z)return}};n.addEventListener("pointerdown",S),n.addEventListener("pointermove",E),n.addEventListener("pointerup",D),n.addEventListener("pointercancel",D);const B=(z,b,U)=>{if(x)return;p="look";const O=a.clone().sub(o),q=Math.max(.5,O.length());let Z=Math.atan2(O.x,O.z);const k=Math.asin(Math.max(-1,Math.min(1,O.y/q)));Z+=U;const J=Math.sin(Z),$=Math.cos(Z),[lt,Y]=M0(o.x+J*z-$*b,o.z+$*z+J*b,h.room);o.set(lt,1.6,Y),a.set(lt+J*Math.cos(k)*q,1.6+Math.sin(k)*q,Y+$*Math.cos(k)*q),d=!0};return N(t,!1),w("room",!0),_=requestAnimationFrame(R),{update:N,setView:w,walk:B,dispose:()=>{f=!1,cancelAnimationFrame(_),n.removeEventListener("pointerdown",S),n.removeEventListener("pointermove",E),n.removeEventListener("pointerup",D),n.removeEventListener("pointercancel",D),c&&v(c),l==null||l.dispose(),r.dispose(),i.dispose()}}}const Jr=16*Math.PI/180,mo={sofa:{deg:16,reach:.6},chair:{deg:16,reach:.6},bench:{deg:16,reach:.6},side:{deg:16,reach:.6},rug:{deg:16,reach:.6},table:{deg:20,reach:.6},desk:{deg:22,reach:.7},bed:{deg:28,reach:.8},dining:{deg:30,reach:.85},dchair:{deg:30,reach:.85}},Vc=(n,t)=>n.pieces.filter(e=>Os(e,t)&&mo[e.category]);function O0(n,t){const e=t==="A"||t==="C"?n.room.l:n.room.w,i=Vc(n,t);if(!i.length)return 0;const r=o=>({A:o.cz+o.d/2,C:n.room.l-(o.cz-o.d/2),D:o.cx+o.w/2,B:n.room.w-(o.cx-o.w/2)})[t],s=Math.max(...i.map(o=>mo[o.category].reach));return Math.max(1.2,Math.min(e*s,Math.max(...i.map(r))+.4))}function B0(n,t){const e=Vc(n,t);return e.length?Math.max(...e.map(i=>mo[i.category].deg))*Math.PI/180:0}function kc(n,t,e,i,r=Jr){const{w:s,l:o,h:a}=n,c=t==="A"||t==="C"?o:s,l={A:[0,0,-1],C:[0,0,1],B:[1,0,0],D:[-1,0,0]}[t],h=new P(...{A:[s/2,a/2,0],C:[s/2,a/2,o],B:[s,a/2,o/2],D:[0,a/2,o/2]}[t]),u=new P(l[0],l[1],l[2]),p=c+3,d=new kr(-1,1,1,-1,.01,p+c+6);d.position.copy(h).addScaledVector(u,-p).add(new P(0,p*Math.tan(r),0)),d.lookAt(h),d.updateMatrixWorld();const _=new P().crossVectors(u,new P(0,1,0)).normalize(),g=t==="A"||t==="C"?s:o,m=[];for(const B of[-g/2,g/2]){const z=h.clone().addScaledVector(_,B).setY(0);m.push(z.clone().setY(a),z.clone(),z.clone().addScaledVector(u,-e))}let f=1/0,x=-1/0,v=1/0,A=-1/0;for(const B of m){const z=B.applyMatrix4(d.matrixWorldInverse);f=Math.min(f,z.x),x=Math.max(x,z.x),v=Math.min(v,z.y),A=Math.max(A,z.y)}const N=(x-f)/2;let w=(A-v)/2;const R=(f+x)/2,C=(v+A)/2,S={w:N*2,h:w*2};let E=C+w;i&&i>0&&(w=N/i,E=A);const D=E-w;return d.left=R-N,d.right=R+N,d.top=D+w,d.bottom=D-w,d.updateProjectionMatrix(),{cam:d,extent:S}}function z0(n,t,e=0,i=Jr){return e>0?kc(n,t,e,void 0,i).extent:{w:t==="A"||t==="C"?n.w:n.l,h:n.h}}function S0(n,t,e,i=0,r=Jr){if(i>0)return kc(n,t,i,e,r).cam;const{w:s,l:o,h:a}=n,c=t==="A"||t==="C"?s:o,l=t==="A"||t==="C"?o:s;let h=c/2,u=a/2;e&&e>0&&(e>=c/a?h=a*e/2:u=c/e/2);const p=new kr(-h,h,u,-u,.01,l+1),d={A:[s/2,a/2,l-.02,s/2,a/2,0],C:[s/2,a/2,o-l+.02,s/2,a/2,o],B:[s-l+.02,a/2,o/2,s,a/2,o/2],D:[l-.02,a/2,o/2,0,a/2,o/2]}[t];return p.position.set(d[0],d[1],d[2]),p.lookAt(d[3],d[4],d[5]),p.updateMatrixWorld(),p}function Or(n,t){const e=new Un().setFromObject(n);if(e.isEmpty())return null;let i=1/0,r=1/0,s=-1/0,o=-1/0,a=0;const c=new P,l=new P().setFromMatrixPosition(t.matrixWorld),h=new P;t.getWorldDirection(h);for(const f of[e.min.x,e.max.x])for(const x of[e.min.y,e.max.y])for(const v of[e.min.z,e.max.z])c.set(f,x,v),!(c.clone().sub(l).dot(h)<=.05)&&(a++,c.project(t),i=Math.min(i,c.x),s=Math.max(s,c.x),r=Math.min(r,c.y),o=Math.max(o,c.y));if(!a)return null;const u=f=>Math.max(0,Math.min(100,(f+1)/2*100)),p=f=>Math.max(0,Math.min(100,(1-f)/2*100)),d=u(i),_=u(s),g=p(o),m=p(r);return _-d>.5&&m-g>.5?[d,g,_-d,m-g]:null}function Wc(n,t,e,i,r){try{const s=[],o=new Map,a=new Map,c=_=>{for(let g=_;g;g=g.parent){const m=g.userData.pick??(g.userData.id!=="sky"?g.userData.id:void 0);if(m)return m}};t.traverse(_=>{const g=_;if(!g.isMesh)return;const m=c(g);let f=0;m&&(f=o.get(m)??0,f||(s.push(m),f=s.length,o.set(m,f)));let x=a.get(f);x||(x=new Yn({side:Ne}),x.color.setRGB((f&255)/255,(f>>8&255)/255,0,on),a.set(f,x)),g.userData.orig=g.material,g.material=x});const l=t.background,h=t.environment;t.background=null,t.environment=null;const u=new Dn(i,r);n.toneMapping=gn,n.setClearColor(0,1),n.setRenderTarget(u),n.render(t,e);const p=new Uint8Array(i*r*4);n.readRenderTargetPixels(u,0,0,i,r,p),n.setRenderTarget(null),u.dispose(),t.background=l,t.environment=h;const d=new Uint16Array(i*r);for(let _=0;_<r;_++)for(let g=0;g<i;g++){const m=((r-1-_)*i+g)*4,f=p[m]+(p[m+1]<<8);d[_*i+g]=f<=s.length?f:0}return{data:d,keys:s}}catch{return}}function y0(n,t,e){t.updateMatrixWorld();const i=new P().setFromMatrixColumn(t.matrixWorld,0).normalize(),r=(t.right-t.left)/2,s=Math.min(1,(e??r)/r),o=new P;for(const a of n.children){const c=a.userData.id;if(!c||c==="walls"||c==="floor"||c==="doors")continue;const l=new Un().setFromObject(a);if(l.isEmpty())continue;let h=1/0,u=-1/0;for(const d of[l.min.x,l.max.x])for(const _ of[l.min.y,l.max.y])for(const g of[l.min.z,l.max.z])o.set(d,_,g).project(t),h=Math.min(h,o.x),u=Math.max(u,o.x);let p=0;u-h>=2*s?p=-(h+u)/2:h<-s?p=-s-h:u>s&&(p=s-u),Math.abs(p)>1e-4&&a.position.addScaledVector(i,p*r)}}function G0(n,t,e=1536,i,r=0,s=Jr){var p;const o=t==="A"||t==="C"?n.room.w:n.room.l,a=n.room.h,c=i??Math.max(256,Math.min(2048,Math.round(e*a/o))),l={...n,openings:n.openings.filter(d=>d.wall===t),pieces:n.pieces.filter(d=>Os(d,t)&&(d.category!=="rug"||r>0)),extras:n.extras.filter(d=>d.wall===t&&d.kind!=="pendant")},h=document.createElement("canvas");h.width=e,h.height=c;const u=new Xr({canvas:h,antialias:!0,preserveDrawingBuffer:!0});try{u.setPixelRatio(1),u.setSize(e,c,!1),u.outputColorSpace=he,u.toneMapping=zr,u.useLegacyLights=!0,u.shadowMap.enabled=!0,u.shadowMap.type=Br;const d=po(l,!1),_=new Yi(u);try{d.scene.environment=_.fromScene(d.envScene,.03).texture}catch{}const g=S0(n.room,t,i?e/c:void 0,r,s);r>0&&d.scene.traverse(D=>{D.userData.id==="walls"&&D.userData.wall&&D.userData.wall!==t&&(D.visible=!1)}),y0(d.scene,g,o/2),u.render(d.scene,g);const m=h.toDataURL("image/jpeg",.92),f={};for(const D of d.scene.children){const B=D.userData.id;if(!B)continue;const z=Or(D,g);z&&(f[B]=z)}d.scene.traverse(D=>{const B=D.userData.id;if(!B||B!=="walls"&&B!=="floor"&&B!=="doors"&&!B.startsWith("window-"))return;let z;for(let J=D;J&&!z;J=J.parent)z=J.userData.wall;if(B!=="floor"&&z!==t)return;const b=Or(D,g);if(!b)return;const U=f[B];if(!U){f[B]=b;return}const O=Math.min(U[0],b[0]),q=Math.min(U[1],b[1]),Z=Math.max(U[0]+U[2],b[0]+b[2]),k=Math.max(U[1]+U[3],b[1]+b[3]);f[B]=[O,q,Z-O,k-q]});const{w:x,l:v,h:A}=n.room,N={A:[x/2,0,0],C:[x/2,0,v],B:[x,0,v/2],D:[0,0,v/2]}[t],w=D=>(1-new P(N[0],D,N[2]).project(g).y)/2*100,R=w(0),C=w(A),S=new P;for(const D of r>0?[]:n.pieces.filter(B=>B.category==="rug"&&Os(B,t))){let B=1/0,z=-1/0;for(const Z of[-D.w/2,D.w/2])for(const k of[-D.d/2,D.d/2])S.set(D.cx+Z,0,D.cz+k).project(g),B=Math.min(B,S.x),z=Math.max(z,S.x);const b=Math.max(0,(B+1)/2*100),U=Math.min(100,(z+1)/2*100),O=Math.max(0,R-7),q=Math.min(100,R+6);U-b>2&&(f[D.id]=[b,O,U-b,q-O])}if(!n.extras.some(D=>D.wall===t&&(D.kind==="art"||D.kind==="mirror"))){const D=l.pieces.filter(b=>b.onWall&&b.h<1.4&&f[b.id]).sort((b,U)=>U.w-b.w)[0],B=D&&f[D.id],z=Math.max(0,C);if(B){const b=B[1]-z-10,U=Math.min(b-6,30),O=[B[0]+B[2]*.18,B[1]-6-U,B[2]*.64,U],q=Object.entries(f).some(([Z,k])=>Z.startsWith("window-")&&k[0]<O[0]+O[2]&&O[0]<k[0]+k[2]&&k[1]<O[1]+O[3]&&O[1]<k[1]+k[3]);U>=10&&!q&&(f[`decor-${t}`]=O)}}_.dispose();const E=Wc(u,d.scene,g,e,c);return d.scene.traverse(D=>{var b,U;const B=D;(U=(b=B.geometry)==null?void 0:b.dispose)==null||U.call(b),[B.material,B.userData.orig].flatMap(O=>Array.isArray(O)?O:O?[O]:[]).forEach(O=>O.dispose())}),{image:m,width:e,height:c,boxes:f,ids:E}}finally{u.dispose(),(p=u.forceContextLoss)==null||p.call(u)}}function H0(n,t=1792,e=1008){var s;const i=document.createElement("canvas");i.width=t,i.height=e;const r=new Xr({canvas:i,antialias:!0,preserveDrawingBuffer:!0});try{r.setPixelRatio(1),r.setSize(t,e,!1),r.outputColorSpace=he,r.toneMapping=zr,r.useLegacyLights=!0,r.shadowMap.enabled=!0,r.shadowMap.type=Br;const o=po({...n,extras:n.extras.filter(_=>_.kind!=="pendant")},!1),a=new Yi(r);try{o.scene.environment=a.fromScene(o.envScene,.03).texture}catch{}const c=Qs("room",n.room,t/e),l=new Ie(c.f,t/e,.05,40);l.position.set(c.p[0],c.p[1],c.p[2]),l.lookAt(c.t[0],c.t[1],c.t[2]),l.updateMatrixWorld(),r.render(o.scene,l);const h=i.toDataURL("image/jpeg",.92),u={};for(const _ of o.scene.children){const g=_.userData.id;if(!g)continue;const m=Or(_,l);m&&(u[g]=m)}const p=(_,g)=>{if(!_)return g;const m=Math.min(_[0],g[0]),f=Math.min(_[1],g[1]),x=Math.max(_[0]+_[2],g[0]+g[2]),v=Math.max(_[1]+_[3],g[1]+g[3]);return[m,f,x-m,v-f]};o.scene.traverse(_=>{const g=_.userData.id;if(!g||g!=="walls"&&g!=="floor"&&g!=="doors"&&!g.startsWith("window-"))return;const m=Or(_,l);m&&(u[g]=p(g==="walls"||g==="doors"?u[g]:void 0,m))}),a.dispose();const d=Wc(r,o.scene,l,t,e);return o.scene.traverse(_=>{var f,x;const g=_;(x=(f=g.geometry)==null?void 0:f.dispose)==null||x.call(f),[g.material,g.userData.orig].flatMap(v=>Array.isArray(v)?v:v?[v]:[]).forEach(v=>v.dispose())}),{image:h,width:t,height:e,boxes:u,ids:d}}finally{r.dispose(),(s=r.forceContextLoss)==null||s.call(r)}}export{mo as VIEW_FOR,m0 as buildPiece,po as buildScene,M0 as clampInside,F0 as createShowroom,S0 as elevationCamera,O0 as floorDepthFor,y0 as keepInFrame,B0 as pitchFor,G0 as renderGuide,H0 as renderRoomGuide,Or as screenBox,Qs as viewFor,z0 as wallViewExtent};
