---
theme: glacier
title: Demo # toc: false
---

```js
const letter = view(
  Inputs.select(["A", "B", "C"], { value: "A", label: "Favorite Letter" })
);
```

```js
const letterInput = Inputs.select(["A", "B", "C"], {
  value: "A",
  label: "Favorite Letter",
});
console.log(letterInput);
console.log(Generators.input(letterInput));
```

```js
const data1 = FileAttachment("data/carroll-gardens.csv").csv({ typed: true });
const data2 = FileAttachment("data/long-island-city.csv").csv({ typed: true });
const data3 = FileAttachment("data/soho-little-italy-nolita.csv").csv({
  typed: true,
});
```
