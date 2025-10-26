import { ref as a, onMounted as h, createElementBlock as p, openBlock as i, createElementVNode as l, toDisplayString as v, withDirectives as f, vModelText as g, createCommentVNode as y, createBlock as b, resolveDynamicComponent as x, createApp as C, h as w } from "vue";
const k = { class: "p-4 text-center" }, M = { class: "text-6xl my-4" }, S = { key: 0 }, D = { key: 1 }, R = { class: "mt-2" }, E = {
  __name: "DiceGame",
  props: ["onResult"],
  setup(c) {
    const e = c, t = a(1), o = a(!1), r = a(""), u = a(""), n = () => {
      o.value = !0;
      let m = 0;
      const s = setInterval(() => {
        t.value = Math.floor(Math.random() * 6) + 1, m++, m > 10 && (clearInterval(s), o.value = !1);
      }, 100);
    };
    h(() => {
      n();
    });
    const d = () => {
      parseInt(r.value) === t.value ? (u.value = "✅ Correct!", setTimeout(() => e.onResult(!0), 1e3)) : (u.value = "❌ Wrong! Try again.", n());
    };
    return (m, s) => (i(), p("div", k, [
      s[1] || (s[1] = l("h2", { class: "text-lg font-semibold mb-2" }, "🎲 Dice Game", -1)),
      s[2] || (s[2] = l("p", null, "Guess how many dots the dice will show!", -1)),
      l("div", M, v(t.value), 1),
      o.value ? (i(), p("div", S, "Rolling...")) : (i(), p("div", D, [
        f(l("input", {
          "onUpdate:modelValue": s[0] || (s[0] = (_) => r.value = _),
          type: "number",
          placeholder: "Enter 1–6",
          class: "border p-2 rounded"
        }, null, 512), [
          [g, r.value]
        ]),
        l("button", {
          onClick: d,
          class: "ml-2 bg-blue-500 text-white px-3 py-1 rounded"
        }, " Submit "),
        l("p", R, v(u.value), 1)
      ]))
    ]));
  }
}, G = {
  key: 0,
  class: "fixed inset-0 bg-black/50 flex items-center justify-center z-50"
}, V = { class: "bg-white rounded-2xl p-6 shadow-lg w-96 relative" }, B = {
  __name: "HumanVerifyModal",
  props: ["onClose", "onSuccess"],
  setup(c) {
    const e = c, t = a(!0), o = a(null);
    h(() => {
      const n = [E], d = n[Math.floor(Math.random() * n.length)];
      o.value = d;
    });
    const r = (n) => {
      t.value = !1, e.onSuccess(n), e.onClose();
    }, u = () => {
      e.onSuccess(!1), e.onClose();
    };
    return (n, d) => t.value ? (i(), p("div", G, [
      l("div", V, [
        l("button", {
          onClick: u,
          class: "absolute top-2 right-3 text-gray-600"
        }, "✖"),
        (i(), b(x(o.value), { onResult: r }, null, 32))
      ])
    ])) : y("", !0);
  }
};
async function T() {
  return new Promise((c) => {
    const e = document.createElement("div");
    document.body.appendChild(e);
    const t = C({
      render: () => w(B, {
        onClose: () => {
          t.unmount(), document.body.removeChild(e);
        },
        onSuccess: (o) => {
          c(o);
        }
      })
    });
    t.mount(e);
  });
}
export {
  T as verifyHuman
};
