---
theme: glacier
title: Demo # toc: false
---

```js
const letter = view(Inputs.select(['A','B','C'], {value: "A", label: "Favorite Letter"}));
```
```js
const letterInput = Inputs.select(['A','B','C'], {value: "A", label: "Favorite Letter"})
console.log(letterInput)
console.log(Generators.input(letterInput))
```