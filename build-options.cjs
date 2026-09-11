// Closed list: only the game's internal fields, never browser, storage or
// Wavedash APIs. Sprite names looked up by string (S[d[0]]) and keys read
// through keys[e.key] stay untouched.
module.exports={
  compress:{passes:3,unsafe:true,unsafe_math:true,toplevel:true,global_defs:{DEV:false}},
  mangle:{toplevel:true,properties:{regex:/^(age|amb|bank|big|boom|cages|cd|cols|dmg|drag|dy|fcd|fl|free|gz|hit|hp|hurt|hyper|jump|lk|mag|ma|mhp|mini|onend|ox|oy|pat|ph|pick|pt|sc|sh|shot|sp|sq|sr|tor|tr|tx|ty|uni|vx|vy)$/}},
  format:{quote_style:1}
};
