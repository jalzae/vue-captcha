import { ref as n, onMounted as P, createElementBlock as y, openBlock as b, createElementVNode as a, withDirectives as E, createCommentVNode as G, withKeys as F, vModelText as L, normalizeClass as $, toDisplayString as R, Fragment as j, renderList as B, createBlock as z, resolveDynamicComponent as A, createApp as N, h as H } from "vue";
const K = { class: "p-4 text-center" }, Y = { class: "flex justify-center mb-6 bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300" }, q = {
  key: 0,
  class: "space-y-3"
}, U = {
  key: 1,
  class: "space-y-3"
}, X = {
  __name: "ImageGame",
  props: ["onResult"],
  setup(x) {
    const h = x, i = n(null), c = n(""), r = n(""), g = n(""), u = n(!1), d = n(""), w = () => Math.floor(Math.random() * 9e3) + 1e3, k = () => {
      const t = i.value.getContext("2d"), o = i.value.width, v = i.value.height, M = t.createLinearGradient(0, 0, o, v);
      M.addColorStop(0, "#f0f4f8"), M.addColorStop(1, "#e0e8f0"), t.fillStyle = M, t.fillRect(0, 0, o, v);
      for (let e = 0; e < 8; e++)
        t.strokeStyle = `rgba(150, 150, 150, ${Math.random() * 0.3})`, t.lineWidth = Math.random() * 2 + 1, t.beginPath(), t.moveTo(Math.random() * o, Math.random() * v), t.lineTo(Math.random() * o, Math.random() * v), t.stroke();
      for (let e = 0; e < 30; e++)
        t.fillStyle = `rgba(100, 100, 100, ${Math.random() * 0.5})`, t.beginPath(), t.arc(
          Math.random() * o,
          Math.random() * v,
          Math.random() * 1.5 + 0.5,
          0,
          Math.PI * 2
        ), t.fill();
      const _ = d.value.toString();
      t.font = "bold 56px Arial", t.textBaseline = "middle";
      const m = o / (_.length + 1);
      for (let e = 0; e < _.length; e++) {
        t.save();
        const l = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"];
        t.fillStyle = l[e % l.length];
        const p = m * (e + 1) + (Math.random() - 0.5) * 10, s = v / 2 + (Math.random() - 0.5) * 8;
        t.translate(p, s), t.rotate((Math.random() - 0.5) * 0.3), t.scale(1 + (Math.random() - 0.5) * 0.1, 1 + (Math.random() - 0.5) * 0.1), t.fillStyle = "rgba(0, 0, 0, 0.1)", t.fillText(_[e], 2, 2), t.fillStyle = l[e % l.length], t.fillText(_[e], 0, 0), t.restore();
      }
      t.strokeStyle = "#999", t.lineWidth = 2, t.strokeRect(0, 0, o, v);
    }, C = () => {
      d.value = w(), c.value = "", r.value = "", u.value = !1, k();
    }, S = () => {
      if (!c.value.trim()) {
        r.value = "❌ Please enter the numbers", g.value = "text-red-600";
        return;
      }
      c.value.trim() === d.value.toString() ? (u.value = !0, r.value = "", setTimeout(() => h.onResult(!0), 1500)) : (r.value = "❌ Incorrect! Try again.", g.value = "text-red-600", c.value = "", setTimeout(C, 500));
    };
    return P(() => {
      C();
    }), (t, o) => (b(), y("div", K, [
      o[2] || (o[2] = a("h2", { class: "text-lg font-semibold mb-4" }, "🖼️ Image Verification", -1)),
      o[3] || (o[3] = a("p", { class: "text-sm text-gray-600 mb-4" }, "Read the numbers from the image and enter them below", -1)),
      a("div", Y, [
        a("canvas", {
          ref_key: "canvas",
          ref: i,
          width: "320",
          height: "120",
          class: "border-2 border-gray-400 rounded bg-white"
        }, null, 512)
      ]),
      a("button", {
        onClick: C,
        class: "mb-4 text-sm text-blue-500 hover:text-blue-700 underline"
      }, " 🔄 Can't read? Get a new image "),
      u.value ? (b(), y("div", U, [...o[1] || (o[1] = [
        a("p", { class: "text-4xl" }, "✅", -1),
        a("p", { class: "text-lg font-semibold text-green-600" }, "Verification Successful!", -1)
      ])])) : (b(), y("div", q, [
        E(a("input", {
          "onUpdate:modelValue": o[0] || (o[0] = (v) => c.value = v),
          type: "text",
          placeholder: "Enter the numbers you see",
          class: "w-full border-2 border-gray-300 p-3 rounded text-lg tracking-widest text-center",
          onKeyup: F(S, ["enter"])
        }, null, 544), [
          [L, c.value]
        ]),
        a("button", {
          onClick: S,
          class: "w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
        }, " ✓ Verify "),
        r.value ? (b(), y("p", {
          key: 0,
          class: $([g.value, "mt-2 font-semibold"])
        }, R(r.value), 3)) : G("", !0)
      ]))
    ]));
  }
}, J = { class: "p-4 text-center" }, O = { class: "flex justify-center mb-6" }, Q = {
  key: 0,
  class: "space-y-3"
}, Z = { class: "flex gap-2 justify-center mb-4" }, ee = ["onClick"], te = ["disabled"], le = {
  key: 1,
  class: "space-y-3"
}, ae = { class: "text-lg font-semibold text-green-600" }, oe = {
  __name: "DiceGame",
  props: ["onResult"],
  setup(x) {
    const h = x, i = n(null), c = n(null), r = n(null), g = n(0), u = n(!0), d = n(""), w = n(""), k = n(!1), C = n(null), S = {
      1: [[0.5, 0.5]],
      2: [[0.3, 0.3], [0.7, 0.7]],
      3: [[0.3, 0.3], [0.5, 0.5], [0.7, 0.7]],
      4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]],
      5: [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7]],
      6: [[0.3, 0.3], [0.3, 0.5], [0.3, 0.7], [0.7, 0.3], [0.7, 0.5], [0.7, 0.7]]
    }, t = (m, e = 0, l = 1) => {
      const p = p.value, s = c.value, f = 200 * l;
      s.save(), s.translate(p.width / 2, p.height / 2), s.rotate(e), s.fillStyle = "white", s.strokeStyle = "#333", s.lineWidth = 3, s.fillRect(-f / 2, -f / 2, f, f), s.strokeRect(-f / 2, -f / 2, f, f);
      const I = S[m];
      s.fillStyle = "#333", I.forEach(([T, D]) => {
        const V = (T - 0.5) * f, W = (D - 0.5) * f;
        s.beginPath(), s.arc(V, W, 8 * l, 0, Math.PI * 2), s.fill();
      }), s.restore();
    }, o = (m = 0) => {
      const e = e.value, l = c.value, p = l.createLinearGradient(0, 0, e.width, e.height);
      p.addColorStop(0, "#e8eef5"), p.addColorStop(1, "#d0dce8"), l.fillStyle = p, l.fillRect(0, 0, e.width, e.height), l.fillStyle = "rgba(0, 0, 0, 0.1)", l.beginPath(), l.ellipse(e.width / 2, e.height - 30, 100, 20, 0, 0, Math.PI * 2), l.fill();
      const s = Math.floor(Math.random() * 6) + 1;
      t(s, m, 0.9);
    }, v = () => {
      let m = 0;
      const e = 40, l = () => {
        o(m / e * Math.PI * 4), m++, m < e ? C.value = requestAnimationFrame(l) : (g.value = Math.floor(Math.random() * 6) + 1, t(g.value, 0, 0.9), u.value = !1);
      };
      l();
    }, M = (m) => {
      u.value || (r.value = r.value === m ? null : m);
    }, _ = () => {
      if (r.value === null) {
        d.value = "❌ Please select a number", w.value = "text-red-600";
        return;
      }
      r.value === g.value ? (k.value = !0, d.value = "", setTimeout(() => h.onResult(!0), 1500)) : (d.value = `❌ Wrong! It was ${g.value}. Rolling again...`, w.value = "text-red-600", r.value = null, setTimeout(() => {
        d.value = "", u.value = !0, v();
      }, 1500));
    };
    return P(() => {
      c.value = i.value.getContext("2d"), v();
    }), (m, e) => (b(), y("div", J, [
      e[1] || (e[1] = a("h2", { class: "text-lg font-semibold mb-4" }, "🎲 Dice Game", -1)),
      e[2] || (e[2] = a("p", { class: "text-sm text-gray-600 mb-4" }, "Watch the dice roll and guess the number", -1)),
      a("div", O, [
        a("canvas", {
          ref_key: "canvas",
          ref: i,
          width: "240",
          height: "240",
          class: "border-4 border-gray-400 rounded-lg bg-gradient-to-b from-gray-50 to-gray-100"
        }, null, 512)
      ]),
      k.value ? (b(), y("div", le, [
        e[0] || (e[0] = a("p", { class: "text-5xl" }, "✅", -1)),
        a("p", ae, "Correct! You guessed " + R(g.value), 1)
      ])) : (b(), y("div", Q, [
        a("div", Z, [
          (b(), y(j, null, B(6, (l) => a("button", {
            key: l,
            onClick: (p) => M(l),
            class: $([
              "w-12 h-12 rounded-lg font-bold text-lg transition-all",
              r.value === l ? "bg-blue-500 text-white scale-110 shadow-lg" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            ])
          }, R(l), 11, ee)), 64))
        ]),
        a("button", {
          onClick: _,
          disabled: r.value === null,
          class: "w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        }, " ✓ Submit Guess ", 8, te),
        d.value ? (b(), y("p", {
          key: 0,
          class: $([w.value, "mt-2 font-semibold text-sm"])
        }, R(d.value), 3)) : G("", !0)
      ]))
    ]));
  }
}, se = {
  key: 0,
  class: "fixed inset-0 bg-black/50 flex items-center justify-center z-50"
}, ne = { class: "bg-white rounded-2xl p-6 shadow-lg w-96 relative" }, re = {
  __name: "HumanVerifyModal",
  props: ["onClose", "onSuccess"],
  setup(x) {
    const h = x, i = n(!0), c = n(null);
    P(() => {
      const u = [X, oe], d = u[Math.floor(Math.random() * u.length)];
      c.value = d;
    });
    const r = (u) => {
      i.value = !1, h.onSuccess(u), h.onClose();
    }, g = () => {
      h.onSuccess(!1), h.onClose();
    };
    return (u, d) => i.value ? (b(), y("div", se, [
      a("div", ne, [
        a("button", {
          onClick: g,
          class: "absolute top-2 right-3 text-gray-600"
        }, "✖"),
        (b(), z(A(c.value), { onResult: r }, null, 32))
      ])
    ])) : G("", !0);
  }
};
async function ie() {
  return new Promise((x) => {
    const h = document.createElement("div");
    document.body.appendChild(h);
    const i = N({
      render: () => H(re, {
        onClose: () => {
          i.unmount(), document.body.removeChild(h);
        },
        onSuccess: (c) => {
          x(c);
        }
      })
    });
    i.mount(h);
  });
}
export {
  ie as verifyHuman
};
