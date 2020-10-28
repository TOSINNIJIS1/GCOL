function Interview1 (path, steps) {
    let sealevel = 0;
    let valley = 0;
    // Step up is U
    // Step down is D

    for (let i = 0; i < path; i++) {
        if (steps[i] == 'U' ) {
            sealevel++;
            
            if(sealevel == 0) {
                valley++
            }
        } else if (steps[i] == 'D') {
            sealevel--
        }
    }
    return valley
}

let path = 8
let steps = 'UDDDUDUU'
console.log(Interview1(path, steps))

function interview2(n, ar) {
    let count = 0;
    const socks = {};

    for (let i of ar) {
        if (socks[i]) {
            socks[i] = false;
            count++
        } else {
            socks[i] = true
        }
    }
    return count
}
let n = 9
let ar = [10,20,20,10,10,30,50,10,20]
console.log(interview2(n, ar))


// rotate the given number in the array from let to right
function rotateLeft(a, d) {
    while (d) {
        a.push(a.shift());
        d--;
    }
    return a;
}
let a = [1,2,3,4,5,4]
let d = 1  // number you want to rotate
console.log(rotateLeft(a,d))

// remove the amount of the number you want with the key parameter, in the array.
function Median(medarr, key) {
    while (key) {
        medarr.pop(medarr.shift());
        key--;
    }
    return medarr;
}
let medarr = [1,2,3,4,5,4]
let key = 1  // number you want to remove from left and right
console.log(Median(medarr, key))

// Equalize the number to delete to make the common number remain
// [2,2,2,3,4] the common number is 2, so 3 and 4 which is means 2 numbers


function equalize(eqArr) {
    let obj = {};
    let maxObj = 0;

    for (let num of eqArr ) {
        console.log(obj[num] = obj[num] + 1 || 1)
    }

    for (let val in obj) {
        if (eqArr[val] > maxObj) {
            console.log(maxObj = obj[val])
        }
    }
    return (eqArr.length - maxObj)
}
let eqArr = [1,2,4,4,5,5,5] // you need to remove four numbers in this array
console.log(equalize(eqArr))