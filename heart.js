const MyHeart = (()=>{
  const qs = new URLSearchParams(location.search);
  function encode(obj){ return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
  function decode(s){ try{ return JSON.parse(decodeURIComponent(escape(atob(s)))) }catch(e){ return null } }
  function defaultData(){ return {messages:["Anh yêu em","Anh yêu em nhiều lắm"], color:"#ff7aa5", music:""}; }
  function getData(){ const d = decode(qs.get('data')); return d && d.messages?.length ? d : defaultData(); }
  function buildUrl(data){
    const base = location.href.endsWith("input.html")
      ? location.href.replace("input.html","index.html")
      : location.origin + location.pathname.replace(/input\.html$/, "index.html");
    return base.split('?')[0] + "?data=" + encode(data);
  }

  function mountRing(messages){
    // Fallback if empty
    if(!messages || !messages.length) messages = defaultData().messages;
    const ring = document.getElementById('ring');
    if(!ring) return;
    ring.innerHTML = "";
    const text = (messages.join("   •   ") + "   ").repeat(4);
    const N = Math.max(100, text.length);
    const R = 240;
    for(let i=0;i<N;i++){
      const span = document.createElement('span');
      span.className = 'char';
      const ch = text[i % text.length];
      span.textContent = ch;
      const angle = (i / N) * Math.PI * 2;
      const x = Math.cos(angle)*R;
      const y = Math.sin(angle)*R;
      span.style.transform = `translate(-50%,-50%) rotate(${angle+Math.PI/2}rad) translate(${x}px, ${y}px)`;
      ring.appendChild(span);
    }
    let a = 0;
    (function tick(){
      a += 0.0022;
      ring.style.transform = `translateX(-50%) rotate(${a}rad)`;
      requestAnimationFrame(tick);
    })();
  }

  function start(){
    const data = getData();
    mountRing(data.messages);

    const canvas = document.getElementById('c');
    const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100);
    camera.position.set(0, 1.0, 5);

    function onResize(){
      renderer.setSize(innerWidth, innerHeight, false);
      camera.aspect = innerWidth/innerHeight;
      camera.updateProjectionMatrix();
    }
    addEventListener('resize', onResize); onResize();
	const R = 210; // trước 240
// trong start() thêm:
function setRingBottom(){
  document.getElementById('msgRing').style.bottom = (innerHeight < 720 ? '6vh' : '8vh');
}
addEventListener('resize', setRingBottom); setRingBottom();
    // Stars
    const starGeom = new THREE.BufferGeometry();
    const starCount = 1500;
    const starPos = new Float32Array(starCount*3);
    for(let i=0;i<starCount;i++){
      const r = 25*Math.random()+10;
      const th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random()-1);
      starPos[i*3+0] = r*Math.sin(ph)*Math.cos(th);
      starPos[i*3+1] = r*Math.cos(ph);
      starPos[i*3+2] = r*Math.sin(ph)*Math.sin(th);
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos,3));
    const starMat = new THREE.PointsMaterial({color:0xffffff, size:0.02, transparent:true, opacity:0.75});
    const stars = new THREE.Points(starGeom, starMat);
    scene.add(stars);

    // Heart
    function buildHeart(colorHex){
      const N = 6000;
      const positions = new Float32Array(N*3);
      const colors = new Float32Array(N*3);
      const c = new THREE.Color(colorHex);
      for(let i=0;i<N;i++){
        const t = Math.random()*Math.PI*2;
        const r = Math.random()*0.35 + 0.65;
        let x = 16*Math.pow(Math.sin(t),3);
        let y = 13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t);
        x *= 0.035*r;
        y *= 0.035*r;
        const z = (Math.random()-0.5)*0.5 * (1 - Math.abs(y)/2.2);
        positions[i*3+0] = x;
        positions[i*3+1] = y*0.9 + 1.25;
        positions[i*3+2] = z;

        const jitter = 0.2*Math.random();
        colors[i*3+0] = Math.min(1, c.r + jitter);
        colors[i*3+1] = Math.max(0, c.g - jitter*0.6);
        colors[i*3+2] = Math.max(0, c.b - jitter*0.9);
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions,3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors,3));
      const mat = new THREE.PointsMaterial({vertexColors:true, size:0.035, transparent:true, opacity:0.95, depthWrite:false});
      const points = new THREE.Points(geom, mat);
      const refl = points.clone();
      refl.scale.y = -1;
      refl.position.y = -0.05;
      refl.material = mat.clone();
      refl.material.opacity = 0.22;
      return {points, refl, geom, mat};
    }

    let heart = buildHeart(data.color);
    scene.add(heart.points);
    scene.add(heart.refl);

    // Sprinkles
    const miniGeom = new THREE.BufferGeometry();
    const miniN = 300;
    const miniPos = new Float32Array(miniN*3);
    for(let i=0;i<miniN;i++){
      miniPos[i*3+0] = (Math.random()-0.5)*1.6;
      miniPos[i*3+1] = Math.random()*1.0 - 0.5;
      miniPos[i*3+2] = (Math.random()-0.5)*1.6;
    }
    miniGeom.setAttribute('position', new THREE.BufferAttribute(miniPos,3));
    const miniMat = new THREE.PointsMaterial({color:new THREE.Color(data.color), size:0.02, opacity:.7, transparent:true});
    const minis = new THREE.Points(miniGeom, miniMat);
    scene.add(minis);

    let t0 = performance.now();
    function animate(now){
      const t = (now - t0)/1000;
      stars.rotation.y = t*0.01;
      heart.points.rotation.y = Math.sin(t*0.5)*0.2 + t*0.15;
      heart.points.rotation.x = Math.cos(t*0.3)*0.07;
      heart.points.position.y = Math.sin(t*2)*0.03;
      heart.refl.rotation.copy(heart.points.rotation);
      heart.refl.position.x = heart.points.position.x;
      heart.refl.position.z = heart.points.position.z;

      const arr = minis.geometry.attributes.position.array;
      for(let i=0;i<miniN;i++){
        arr[i*3+1] += 0.003 + Math.random()*0.002;
        if(arr[i*3+1] > 1.2) arr[i*3+1] = -0.6;
      }
      minis.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene,camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    const recolor = document.getElementById('recolor');
    if(recolor){
      recolor.onclick = ()=>{
        const col = prompt("Nhập mã màu #RRGGBB:", data.color);
        if(!col) return;
        data.color = col;
        scene.remove(heart.points); scene.remove(heart.refl);
        heart.geom.dispose(); heart.mat.dispose();
        heart = buildHeart(data.color);
        scene.add(heart.points); scene.add(heart.refl);
        miniMat.color = new THREE.Color(data.color);
      };
    }

    const btn = document.getElementById('audioToggle');
    let audio = null, playing=false;
    function ensureAudio(){
      if(audio) return audio;
      const src = data.music || "assets/music/put-your-music-here.mp3";
      audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0.8;
      return audio;
    }
    btn.onclick = async ()=>{
      const a = ensureAudio();
      try{
        if(!playing){ await a.play(); playing=true; btn.textContent="⏸️ Dừng nhạc"; }
        else { a.pause(); playing=false; btn.textContent="▶️ Nhạc"; }
      }catch(e){ alert("Trình duyệt chặn tự phát. Hãy nhấn lại để phát nhạc."); }
    };
  }

  return {start, buildUrl, getData};
})();
