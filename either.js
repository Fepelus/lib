
const stringify = function (input) {
    return (
        typeof input === "string"
        ? input
        : JSON.stringify(input)
    );
};

const of = function (v) {
    return {
        map: (f) => of(f(v)),
        ap: (other) => other.map((f) => f(v)),
        join: () => v,
        chain: (f) => of(f(v)).join(),
        bimap: (ignore, g) => of(g(v)),
        inspect: () => `Right(${stringify(v)})`
    };
};

const right = of;

const left = function (v) {
    return {
        map: () => left(v),
        ap: () => left(v),
        join: () => left(v),
        chain: () => left(v),
        bimap: (f, ignore) => left(f(v)),
        inspect: () => `Left(${stringify(v)})`
    };
};

export default Object.freeze({
    of,
    left,
    right
});
