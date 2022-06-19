require("fs").writeFileSync("./config.production.json", process.env["ROTMG_CONFIG"]);
console.log("copied config");