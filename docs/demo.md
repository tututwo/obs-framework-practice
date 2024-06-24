---
theme: glacier
title: Demo # toc: false
---

```js
const letter = view(
  Inputs.select(["A", "B", "C"], { value: "A", label: "Favorite Letter" })
);
```

## Using vanilla Observable Input + Generator

```js
const teamHTML = Inputs.radio(
  ["Metropolis Meteors", "Rockford Peaches", "Bears"],
  {
    label: "Favorite teams:",
    value: "Metropolis Meteors",
  }
);
```

```js
const teamValue = Generators.input(teamHTML);
```

This is Observable Input${teamHTML}

My team is ${teamValue}

<!-- *if using view function* -->

## Using view Function

```js
const team = view(
  Inputs.radio(["Metropolis Meteors", "Rockford Peaches", "Bears"], {
    label: "Favorite team(via view):",
    value: "Metropolis Meteors",
  })
);
const teamMute = Mutable("");
// team.addEventListener('input', () => {
//   teamMute.value = team;
// });
```



My real team is ${team}


## Mutable Practice

```js
const count = Mutable(0);
const increment = () => ++count.value;
const reset = () => (count.value = 0);
```

```js
const numberMutator = Inputs.button([
  ["Increment", increment],
  ["Reset", reset],
]);
```

```js
console.log(count);
```

${numberMutator}
${count}

## Validation
