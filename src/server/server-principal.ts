"use strict";

import {AppSiper} from "./app-principal";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
new AppSiper().start().catch(e=>{
    console.log(e)
})