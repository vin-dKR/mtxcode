import type { Challenge, Topic } from './challenges';

export const notionWeek1Topics: Topic[] = [
    { id: 'js-values', label: 'JS from scratch · Values & references', description: 'Primitive values, object references, mutation, replacement, and reassignment.' },
    { id: 'js-types', label: 'JS from scratch · Types & numbers', description: 'typeof, Symbols, strings, Number precision, NaN, Infinity, and safe integers.' },
    { id: 'js-absence', label: 'JS from scratch · Absence & JSON', description: 'undefined, null, property presence, defaults, returns, and serialization.' },
    { id: 'js-equality', label: 'JS from scratch · Equality reasoning', description: 'Identity, strict and loose equality, ToPrimitive, and conversion traces.' },
    { id: 'js-final', label: 'JS from scratch · Week 1 final', description: 'Mixed output tracing and conceptual interview questions.' },
];

const sourcePage = 'https://app.notion.com/p/vinodkrs/Week-1-Complete-Question-Bank-419a21709a59819a81d2d7c072dfa43a';

function question(id: string, topic: string, title: string, prompt: string, code: string, difficulty: Challenge['difficulty'] = 'Medium'): Challenge {
    return {
        id: `notion-${id}`,
        topic,
        title,
        difficulty,
        prompt,
        example: 'Predict the output or explain the mechanism before running this code.',
        solutions: { js: code, ts: code },
        sourceUrl: sourcePage,
    };
}

export const notionWeek1Challenges: Challenge[] = [
    // Baseline diagnostic
    question('baseline-01', 'js-types', 'Diagnostic · typeof and types', 'Predict every output and explain the typeof result for each value.', `console.log(typeof null); // "object"
console.log(typeof NaN); // "number"
console.log(typeof []); // "object"
console.log(typeof {}); // "object"`),
    question('baseline-02', 'js-types', 'Diagnostic · parseInt and Number', 'Compare radix-aware prefix parsing with full numeric conversion.', `console.log(parseInt("0x123"));
console.log(parseInt("0x123", 10));
console.log(Number("0x123"));`),
    question('baseline-03', 'js-equality', 'Diagnostic · coercion and equality', 'Trace each abstract-equality conversion in rule order.', `console.log([] == ![]);
console.log([] == false);
console.log("" == false);
console.log([] === false);`),
    question('baseline-04', 'js-values', 'Diagnostic · hoisting and TDZ', 'Compare var hoisting with a let binding in the temporal dead zone.', `console.log(a);
var a = 10;
console.log(a);

// Compare with:
// console.log(score);
// let score = 10;`),
    question('baseline-05', 'js-values', 'Diagnostic · closures', 'Explain the shared var binding and per-iteration let binding.', `const varResult = [];
for (var i = 0; i < 3; i++) {
    varResult.push(() => i);
}

const letResult = [];
for (let j = 0; j < 3; j++) {
    letResult.push(() => j);
}`),
    question('baseline-06', 'js-values', 'Diagnostic · this binding', 'Explain what happens when a method is extracted and how bind preserves its receiver.', `"use strict";
const account = { id: 42, getId() { return this.id; } };
const getId = account.getId;
console.log(getId());
console.log(account.getId.bind(account)());`),
    question('baseline-07', 'js-values', 'Diagnostic · object property keys', 'Trace ToPropertyKey and explain why both object keys collide.', `const data = {};
data[{}] = "first";
data[{}] = "second";
console.log(Object.keys(data).length);
console.log(data["[object Object]"]);`),
    question('baseline-08', 'js-values', 'Diagnostic · event loop', 'Explain the synchronous, microtask, and timer ordering.', `console.log("start");
setTimeout(() => console.log("timer"), 0);
Promise.resolve().then(() => console.log("promise"));
console.log("end");`),
    question('baseline-09', 'js-values', 'Diagnostic · shallow copy', 'Explain the separate outer arrays and shared nested object.', `const original = [{ n: 1 }];
const copy = [...original];
copy[0].n = 99;
console.log(original[0].n);
console.log(original === copy);`),
    question('baseline-10', 'js-values', 'Diagnostic · groupBy', 'Implement the accumulator shape and keep the reducer callback returning the accumulator.', `function groupBy(items, key) {
    return items.reduce((acc, item) => {
        const groupKey = item[key];
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(item);
        return acc;
    }, {});
}`),

    // Lesson 01
    question('lesson01-01', 'js-values', 'Primitive assignment', 'Explain why changing b does not change a.', `let a = 10;
let b = a;
b = 20;
console.log(a, b);`, 'Easy'),
    question('lesson01-02', 'js-values', 'Shared object reference', 'Explain the relationship between first and second.', `const first = { age: 20 };
const second = first;
second.age = 30;
console.log(first.age, second.age);
console.log(first === second);`, 'Easy'),
    question('lesson01-03', 'js-values', 'Replacing a nested property', 'Explain why replacing profile differs from changing profile.age.', `const user1 = { profile: { age: 20 } };
const user2 = user1;
user2.profile = { age: 30 };
console.log(user1.profile.age);`),
    question('lesson01-04', 'js-values', 'Reassigning a variable', 'Explain which reference changed and why x remains separate.', `let x = { score: 10 };
let y = x;
y = { score: 50 };
console.log(x.score, y.score, x === y);`, 'Easy'),
    question('lesson01-05', 'js-values', 'Nested reference graph', 'Draw the reference relationships and explain all three identity results.', `const a = { profile: { city: "Delhi" } };
const b = a;
const c = { profile: a.profile };
console.log(a === b);
console.log(a.profile === c.profile);
console.log(a === c);`),
    question('lesson01-06', 'js-values', 'Explain mutation versus reassignment', 'Explain primitive copying, reference copying, mutation, property replacement, and variable reassignment.', `// Explain these operations in your own words:
let primitive = 1;
let copied = primitive;
const object = { nested: { value: 1 } };
const alias = object;
alias.nested.value = 2;
alias.nested = { value: 3 };
// Reassignment would require: let alias = object; alias = { value: 4 };`),

    // Lesson 02
    question('lesson02-01', 'js-types', 'Predict all primitive types', 'Predict every typeof result, including the historical null quirk and NaN.', `console.log(typeof "hello");
console.log(typeof 42);
console.log(typeof 42n);
console.log(typeof true);
console.log(typeof undefined);
console.log(typeof null);
console.log(typeof Symbol("id"));
console.log(typeof NaN);
console.log(typeof []);
console.log(typeof {});`, 'Easy'),
    question('lesson02-02', 'js-types', 'String immutability', 'Why are the two outputs different?', `let value = "hello";
value.toUpperCase();
console.log(value);
value = value.toUpperCase();
console.log(value);`, 'Easy'),
    question('lesson02-03', 'js-types', 'Symbol identity', 'Explain Symbol() versus Symbol.for().', `const a = Symbol("id");
const b = Symbol("id");
const c = Symbol.for("shared");
const d = Symbol.for("shared");
console.log(a === b);
console.log(c === d);`),
    question('lesson02-04', 'js-types', 'Number precision and BigInt', 'Explain the different representations and the safe-integer boundary.', `console.log(0.1 + 0.2);
console.log(0.1 + 0.2 === 0.3);
console.log(Number.MAX_SAFE_INTEGER);
console.log(Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2);
console.log(9007199254740993);
console.log(9007199254740993n);`),
    question('lesson02-05', 'js-types', 'Safe integer boundary', 'Explain why not every integer above 2^53 is unrepresentable and what the safe range guarantees.', `console.log(Number.MAX_SAFE_INTEGER);
console.log(Number.isSafeInteger(2 ** 53 - 1));
console.log(Number.isSafeInteger(2 ** 53));`),

    // Lesson 03
    question('lesson03-01', 'js-absence', 'Missing versus explicitly undefined', 'Explain why property reads look identical while property checks differ.', `const a = {};
const b = { score: undefined };
console.log(a.score, b.score);
console.log(Object.hasOwn(a, "score"));
console.log(Object.hasOwn(b, "score"));
console.log("score" in a);
console.log("score" in b);`),
    question('lesson03-02', 'js-absence', 'Default parameters', 'Which calls use the default and why?', `function show(value = "default") {
    return value;
}
console.log(show());
console.log(show(undefined));
console.log(show(null));
console.log(show(0));
console.log(show(false));
console.log(show(""));`, 'Easy'),
    question('lesson03-03', 'js-absence', 'Function returns', 'Explain no return, bare return, and returning null.', `function first() {}
function second() { return; }
function third() { return null; }
console.log(first(), second(), third());`, 'Easy'),
    question('lesson03-04', 'js-absence', 'Null property access', 'Which expression throws and why?', `console.log({}.name);
console.log(null.name);`, 'Easy'),
    question('lesson03-05', 'js-absence', 'JSON serialization', 'Explain which properties survive serialization and what JSON.parse returns.', `const data = {
    a: undefined,
    b: null,
    c: 10,
    d: () => "hello",
};
const json = JSON.stringify(data);
console.log(json);
console.log(typeof json);
console.log(JSON.parse(json));`),
    question('lesson03-06', 'js-absence', 'Undefined in arrays', 'Why is undefined in an array serialized differently from an undefined object property?', `console.log(JSON.stringify([undefined, null, 10]));`),
    question('lesson03-07', 'js-absence', 'BigInt and JSON', 'Explain why JSON.stringify throws for BigInt and describe a precision-safe serialization strategy.', `const payload = { id: 9007199254740993n };
// JSON.stringify(payload); // TypeError by default
const safePayload = { id: payload.id.toString() };
console.log(JSON.stringify(safePayload));`),
    question('lesson03-08', 'js-absence', 'Serialization and deserialization', 'Explain serialization, deserialization, and why applications use JSON.', `const requestBody = JSON.stringify({ ok: true, count: 2 });
const parsed = JSON.parse(requestBody);
console.log(typeof requestBody, parsed.count);`),

    // Lesson 04
    question('lesson04-01', 'js-types', 'NaN comparisons', 'Explain why NaN behaves unusually.', `console.log(NaN === NaN);
console.log(NaN == NaN);
console.log(Object.is(NaN, NaN));
console.log(Number.isNaN(NaN));`),
    question('lesson04-02', 'js-types', 'Coercing versus non-coercing NaN checks', 'Explain global isNaN versus Number.isNaN.', `console.log(isNaN("abc"));
console.log(Number.isNaN("abc"));
console.log(Number.isNaN(Number("abc")));
console.log(isNaN("123"));
console.log(Number.isNaN("123"));`),
    question('lesson04-03', 'js-types', 'Infinity and finiteness', 'Explain the difference between the two finiteness checks.', `console.log(1 / 0);
console.log(-1 / 0);
console.log(Number.isFinite(Infinity));
console.log(Number.isFinite("10"));
console.log(isFinite("10"));`),
    question('lesson04-04', 'js-types', 'Negative zero', 'Why can division distinguish values that strict equality treats as equal?', `console.log(0 === -0);
console.log(Object.is(0, -0));
console.log(1 / -0);`),
    question('lesson04-05', 'js-types', 'Integer and safe-integer checks', 'Explain integer versus safe integer.', `console.log(Number.isInteger(10));
console.log(Number.isInteger(10.5));
console.log(Number.isSafeInteger(2 ** 53));
console.log(Number.isSafeInteger(2 ** 53 - 1));`),

    // Lesson 05
    question('lesson05-01', 'js-types', 'Basic typeof limits', 'Explain why typeof is useful but not a complete type checker.', `console.log(typeof (() => {}));
console.log(typeof 10n);`),
    question('lesson05-02', 'js-types', 'Array detection', 'Explain why an array-like object is not necessarily an array.', `console.log(Array.isArray([]));
console.log(Array.isArray({ length: 0 }));`),
    question('lesson05-03', 'js-types', 'NaN detection tools', 'Compare coercing and non-coercing NaN checks.', `console.log(typeof NaN);
console.log(isNaN("abc"));
console.log(Number.isNaN("abc"));
console.log(Number.isNaN(Number("abc")));`),
    question('lesson05-04', 'js-types', 'Unresolved identifier', 'Why does typeof on an undeclared identifier not throw a ReferenceError?', `console.log(typeof notDeclared);`),
    question('lesson05-05', 'js-types', 'Temporal dead zone', 'Why does this throw even though typeof on an undeclared identifier does not?', `console.log(typeof score);
let score = 10;`),
    question('lesson05-06', 'js-types', 'Choose the correct type checks', 'For an unknown value, choose the check for array, exact NaN, finite Number without coercion, integer Number, and safe integer.', `const value = 42;
console.log(Array.isArray(value));
console.log(Number.isNaN(value));
console.log(Number.isFinite(value));
console.log(Number.isInteger(value));
console.log(Number.isSafeInteger(value));`),
    question('lesson05-07', 'js-types', 'Why typeof is insufficient', 'Explain the gaps in typeof and name the more precise checks you would use.', `const value = [];
console.log(typeof value);
console.log(Array.isArray(value));`),

    // Lesson 06
    question('lesson06-01', 'js-equality', 'Strict versus loose equality', 'For each comparison, explain whether coercion occurs.', `console.log(5 == "5");
console.log(5 === "5");
console.log(false == 0);
console.log(false === 0);`, 'Easy'),
    question('lesson06-02', 'js-equality', 'null and undefined equality', 'Which comparison uses the special null/undefined rule?', `console.log(null == undefined);
console.log(null === undefined);
console.log(null == 0);
console.log(undefined == false);`, 'Easy'),
    question('lesson06-03', 'js-equality', 'NaN and signed zero identity', 'Compare equality operators with Object.is.', `console.log(NaN === NaN);
console.log(Object.is(NaN, NaN));
console.log(0 === -0);
console.log(Object.is(0, -0));`),
    question('lesson06-04', 'js-equality', 'Object identity', 'Explain why object identity and primitive property values produce different results.', `const a = { x: 1 };
const b = { x: 1 };
const c = a;
console.log(a === b);
console.log(a === c);
console.log(a.x === b.x);`, 'Easy'),
    question('lesson06-05', 'js-equality', 'Array identity', 'Explain why loose equality does not deep-compare two objects.', `console.log([] === []);
const first = [1, 2];
const second = first;
console.log(first === second);
console.log([] == []);`, 'Easy'),
    question('lesson06-06', 'js-equality', 'Trace array conversion', 'Write every step in the loose-equality conversion path and explain why ToBoolean is not used.', `console.log([] == 0);
console.log([] === 0);`),
    question('lesson06-07', 'js-equality', 'Array conversion challenge', 'Trace types, rules, conversions, and final results for every expression.', `console.log([] == false);
console.log([] == true);
console.log([1] == 1);
console.log([1, 2] == "1,2");`),
    question('lesson06-08', 'js-equality', 'Equality decision-tree practice', 'Do not guess from truthiness. Trace each operand type and conversion in order.', `console.log([1, 2] == 1);
console.log([1] == true);
console.log([0] == false);`),
    question('lesson06-09', 'js-equality', 'Same type or object conversion?', 'Explain identity comparison when both operands are objects versus ToPrimitive with a primitive.', `const a = [];
const b = [];
const c = a;
console.log(a == b);
console.log(a == c);
console.log(a == "");
console.log(a == 0);`),
    question('lesson06-10', 'js-equality', 'Explain the conversion operations', 'Explain ToBoolean, ToNumber, ToString, and ToPrimitive with one example each.', `// Explain each operation with a concrete example:
Boolean([]);
Number("42");
String(42);
[].valueOf();`),

    // Week 1 final assessment
    question('final-01', 'js-final', 'Final · type classification', 'Classify each value precisely and explain the typeof quirks.', `console.log(typeof null);
console.log(typeof NaN);
console.log(typeof []);
console.log(typeof {});
console.log(typeof 1n);`),
    question('final-02', 'js-final', 'Final · assignment and references', 'Trace primitive reassignment, object mutation, and identity.', `let a = 5;
let b = a;
a++;
const x = { n: 1 };
const y = x;
y.n++;
console.log(a, b, x.n, y.n, x === y);`),
    question('final-03', 'js-final', 'Final · missing and undefined', 'Distinguish a missing property from an own property whose value is undefined.', `const obj = { a: undefined, b: null };
console.log(obj.c, obj.a);
console.log(Object.hasOwn(obj, "c"), Object.hasOwn(obj, "a"));`),
    question('final-04', 'js-final', 'Final · number edge cases', 'Explain each numeric predicate and edge case.', `console.log(0.1 + 0.2);
console.log(Number.isNaN(NaN));
console.log(Number.isFinite("5"));
console.log(Object.is(0, -0));
console.log(Number.isSafeInteger(2 ** 53));`),
    question('final-05', 'js-final', 'Final · equality trace', 'For every result, show the exact conversion path or the rule that determines false.', `console.log("5" == 5);
console.log(false == "0");
console.log([] == 0);
console.log([1] == 1);
console.log(null == undefined);`),
    question('final-06', 'js-final', 'Final · conceptual interview questions', 'Answer these in interview language and distinguish ECMAScript rules from engine implementation details.', `// Why is null a primitive while typeof null is "object"?
// Why does assigning an object to another variable not create a second object?
// Why can identical object literals be unequal?
// Why do MAX_SAFE_INTEGER and MAX_VALUE differ?
// Why do missing identifiers and TDZ bindings differ under typeof?
// Why is [] truthy while [] == 0 can be true?
// What does ECMAScript specify versus the engine?
// How should call stack and heap be used as conceptual models?`),
];

