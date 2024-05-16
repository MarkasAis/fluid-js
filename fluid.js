const N = 200;
const dt = 0.2;
const diff = 0.0000001;
const visc = 0.0000001;

const iter = 4;

let s = Array(N*N).fill(0);
let density = Array(N*N).fill(0);

let vx = Array(N*N).fill(0);
let vy = Array(N*N).fill(0);

let vx0 = Array(N*N).fill(0);
let vy0 = Array(N*N).fill(0);

function ix(x, y) {
    return y * N + x;
}

function addDensity(x, y, amount) {
    density[ix(x, y)] += amount;
}

function addVelocity(x, y, amountX, amountY) {
    let index = ix(x, y);
    vx[index] += amountX;
    vy[index] += amountY;
}

function step() {
    diffuse(1, vx0, vx);
    diffuse(2, vy0, vy);
    
    project(vx0, vy0, vx, vy);
    
    advect(1, vx, vx0, vx0, vy0);
    advect(2, vy, vy0, vx0, vy0);
    
    project(vx, vy, vx0, vy0);
    
    diffuse(0, s, density);
    advect(0, density, s, vx, vy);
}

function setBound(b, x) {
    for(let i = 1; i < N - 1; i++) {
        x[ix(i, 0  )] = b == 2 ? -x[ix(i, 1  )] : x[ix(i, 1  )];
        x[ix(i, N-1)] = b == 2 ? -x[ix(i, N-2)] : x[ix(i, N-2)];
    }

    for(let j = 1; j < N - 1; j++) {
        x[ix(0  , j)] = b == 1 ? -x[ix(1  , j)] : x[ix(1  , j)];
        x[ix(N-1, j)] = b == 1 ? -x[ix(N-2, j)] : x[ix(N-2, j)];
    }

    x[ix(0, 0)]     = 0.5 * (x[ix(1  , 0  )] + x[ix(0  , 1  )]);
    x[ix(0, N-1)]   = 0.5 * (x[ix(1  , N-1)] + x[ix(0  , N-2)]);
   
    x[ix(N-1, 0)]   = 0.5 * (x[ix(N-2, 0  )] + x[ix(N-1, 1  )]);
    x[ix(N-1, N-1)] = 0.5 * (x[ix(N-2, N-1)] + x[ix(N-1, N-2)]);
}

function linSolve(b, x, x0, a, c) {
    let cRecip = 1.0 / c;
    for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
            x[ix(i, j)] =
                (x0[ix(i, j)]
                    + a*(    x[ix(i+1, j  )]
                            +x[ix(i-1, j  )]
                            +x[ix(i  , j+1)]
                            +x[ix(i  , j-1)]
                    )) * cRecip;
        }
    }
    setBound(b, x);
}

function diffuse(b, x, x0) {
    let a = dt * diff * (N - 2) * (N - 2);
    linSolve(b, x, x0, a, 1 + 6 * a);
}

function project(velocX, velocY, p, div) {
    for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
            div[ix(i, j)] = -0.5*(
                     velocX[ix(i+1, j  )]
                    -velocX[ix(i-1, j  )]
                    +velocY[ix(i  , j+1)]
                    -velocY[ix(i  , j-1)]
                )/N;
            p[ix(i, j)] = 0;
        }
    }
    setBound(0, div); 
    setBound(0, p);
    linSolve(0, p, div, 1, 6);
    
    for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
            velocX[ix(i, j)] -= 0.5 * (  p[ix(i+1, j)]
                                           -p[ix(i-1, j)]) * N;
            velocY[ix(i, j)] -= 0.5 * (  p[ix(i, j+1)]
                                           -p[ix(i, j-1)]) * N;
        }
    }
    setBound(1, velocX);
    setBound(2, velocY);
}

function advect(b, d, d0, velocX, velocY) {
    let i0, i1, j0, j1;
  
    let dtx = dt * (N - 2);
    let dty = dt * (N - 2);
  
    let s0, s1, t0, t1;
    let tmp1, tmp2, x, y;
  
    let Nfloat = N - 2;
    let ifloat, jfloat;
    let i, j;
  
    for (j = 1, jfloat = 1; j < N - 1; j++, jfloat++) {
      for (i = 1, ifloat = 1; i < N - 1; i++, ifloat++) {
        tmp1 = dtx * velocX[ix(i, j)];
        tmp2 = dty * velocY[ix(i, j)];
        x = ifloat - tmp1;
        y = jfloat - tmp2;
  
        if (x < 0.5) x = 0.5;
        if (x > Nfloat + 0.5) x = Nfloat + 0.5;
        i0 = Math.floor(x);
        i1 = i0 + 1.0;
        if (y < 0.5) y = 0.5;
        if (y > Nfloat + 0.5) y = Nfloat + 0.5;
        j0 = Math.floor(y);
        j1 = j0 + 1.0;
  
        s1 = x - i0;
        s0 = 1.0 - s1;
        t1 = y - j0;
        t0 = 1.0 - t1;
  
        let i0i = Math.trunc(i0);
        let i1i = Math.trunc(i1);
        let j0i = Math.trunc(j0);
        let j1i = Math.trunc(j1);
  
        d[ix(i, j)] =
          s0 * (t0 * d0[ix(i0i, j0i)] + t1 * d0[ix(i0i, j1i)]) +
          s1 * (t0 * d0[ix(i1i, j0i)] + t1 * d0[ix(i1i, j1i)]);
      }
    }
  
    setBound(b, d);
  }
  

// function advect(b, d, d0, velocX, velocY) {
//     let i0, i1, j0, j1;
    
//     let dtx = dt * (N - 2);
//     let dty = dt * (N - 2);
    
//     let s0, s1, t0, t1;
//     let tmp1, tmp2, x, y;
    
//     let Nfloat = N;
//     let ifloat, jfloat;
//     let i, j;
    
//     for (j = 1, jfloat = 1; j < N - 1; j++, jfloat++) { 
//         for (i = 1, ifloat = 1; i < N - 1; i++, ifloat++) {
//             tmp1 = dtx * velocX[ix(i, j)];
//             tmp2 = dty * velocY[ix(i, j)];
//             x    = ifloat - tmp1; 
//             y    = jfloat - tmp2;
            
//             if(x < 0.5) x = 0.5; 
//             if(x > Nfloat + 0.5) x = Nfloat + 0.5; 
//             i0 = Math.floor(x); 
//             i1 = i0 + 1.0;
//             if(y < 0.5) y = 0.5; 
//             if(y > Nfloat + 0.5) y = Nfloat + 0.5; 
//             j0 = Math.floor(y);
//             j1 = j0 + 1.0;
            
//             s1 = x - i0; 
//             s0 = 1.0 - s1; 
//             t1 = y - j0; 
//             t0 = 1.0 - t1;
            
//             let i0i = Math.trunc(i0);
//             let i1i = Math.trunc(i1);
//             let j0i = Math.trunc(j0);
//             let j1i = Math.trunc(j1);

//             if (isNaN(i0i)) {
//                 console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa");
//                 return;
//             }
            
//             d[ix(i, j)] = 
//                 s0 * (t0 * d0[ix(i0i, j0i)] + t1 * d0[ix(i0i, j1i)]) +
//                 s1 * (t0 * d0[ix(i1i, j0i)] + t1 * d0[ix(i1i, j1i)]);
//         }
//     }
//     setBound(b, d);
// }