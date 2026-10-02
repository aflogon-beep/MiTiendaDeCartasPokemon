// Azar: enteros, elegir de una lista, elegir con pesos, gaussiana aproximada y generador con semilla.
export const rnd=n=>Math.floor(Math.random()*n);
export const pick=a=>a[rnd(a.length)];
export const gauss=()=>Math.random()+Math.random()+Math.random()-1.5;
export const wpick=o=>{let t=0;for(const k in o)t+=o[k];let r=Math.random()*t;for(const k in o){r-=o[k];if(r<=0)return k}return Object.keys(o)[0]};
export const srand=s=>()=>{s=(s*16807)%2147483647;return (s-1)/2147483646};
