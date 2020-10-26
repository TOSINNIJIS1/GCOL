// import React, { useState } from 'react';

// export default function () {
//     const [state, setState] = useState({welcome: "Welcome, It's time for you to know the rules before proceeding", age: 20, name: 'Vincent'})

//     const onClick = () => {
//         setTimeout(() => {setState({name: 'Boluwatife', age: 22})}, 5000)
//     }
    
// return(
//         <div onClick={onClick}> my name is {state.welcome} I'm {state.age} years old </div>
//     )
// }

let fil = [1,2,3,1]
let t = fil.filter((item, i) => fil.includes(item, i+ 1))
console.log(t)

const bang = {
    name: 'Vincent'
}
// bang.name = 'benny'
console.log(bang.name)

// function firstDuplicate(a) {
//     return a.filter((item, i) => a.includes(item, i+1))
// }

// const a = [1,1,2,3,4,5,5]

function firstDuplicate(a) {
    let seen = []
    for (let duplicate of a) {
        if (seen[duplicate]) {
            return duplicate
        } else {
            seen[duplicate] = duplicate
        }
  
    }
    return -1
    //     if (seen[duplicate]) {
    //         return duplicate
    //     } else {
    //         seen[duplicate] = duplicate
    //     }
    // }
    // return -1
}

let a = [1,2,3,4,3,5,4]
console.log(firstDuplicate(a))

function firstNotRepeatingCharacter(s) {
    for (let char = 0; char < s.length; char++) {
        if (s.indexOf(s.charAt(char)) == s.lastIndexOf(s.charAt(char))) {
            return (s.charAt(char));
        }
    }
    return '_'

}


const s = 'bibi'
console.log(firstNotRepeatingCharacter(s))


function century(year) {
    console.log(Math.round(year / 100))
    
}

century(1997)

function checkPalindrome(string) {
    if (string) {
        return (string.split('').reverse().join(''))
    }   
}

console.log(checkPalindrome('abac'))




// Rotation
function rotateImage(a) {
    // Horizontal to Vertical start here
    // return a.map((row, rowIndex) => a.map(data => data[rowIndex]))
    // End here

    // Image rotate start here
    // return a.map((data, i) => a.map(info => info[i]).reverse())
    // ends here

    return a.map((data, i) => a.map(info => info[i]) )
}



a = [[1,2,3], 
 [4,5,6], 
 [7,8,9]]

console.log(rotateImage(a))


// Increase multiplications with comma

function Addition (...numbers) {
    return numbers.reduce((acc, current) => {
        return acc+= acc;
    })
}

console.log(Addition(3,0,0,0))