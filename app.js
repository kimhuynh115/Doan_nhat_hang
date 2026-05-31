const FARE_ORDER = [

"E1_ECO",
"A1_ECO",
"Z1_ECO",
"W1_ECO",
"U1_ECO",
"J1_ECO",
"I1_ECO",
"B1_ECO",
"H1_ECO",
"K1_ECO",
"L1_ECO",
"M1_ECO",
"N1_ECO",
"Q1_ECO",
"V1_ECO",
"R1_ECO",
"T1_ECO",
"Y1_ECO"

];

let legAverage = {
    1:0,
    2:0
};

let legRoute = {
    1:"",
    2:""
};

function money(value){

    return Math.round(value)
        .toLocaleString("vi-VN");

}

function parseMoney(value){

    return Number(

        value
            .replace(/,/g,"")
            .replace(".00","")

    );

}

function normalizeLine(line){

    return line

        .replace(/\s+/g," ")

        .replace(/EY ECO/gi,"E1_ECO")
        .replace(/E¥ ECO/gi,"E1_ECO")

        .replace(/Wi_ECO/gi,"W1_ECO")
        .replace(/Wl_ECO/gi,"W1_ECO")

        .replace(/IA1_ECO/gi,"A1_ECO")

        .replace(/Z1_FCO/gi,"Z1_ECO")
        .replace(/L1_FCO/gi,"L1_ECO")

        .replace(/B1_EC0/gi,"B1_ECO")
        .replace(/H1_EC0/gi,"H1_ECO")
        .replace(/J1_EC0/gi,"J1_ECO")
        .replace(/I1_EC0/gi,"I1_ECO")
        .replace(/K1_EC0/gi,"K1_ECO")
        .replace(/L1_EC0/gi,"L1_ECO")
        .replace(/M1_EC0/gi,"M1_ECO")
        .replace(/N1_EC0/gi,"N1_ECO")
        .replace(/Q1_EC0/gi,"Q1_ECO")

        .replace(/l1_ECO/gi,"I1_ECO")
        .replace(/11_ECO/gi,"I1_ECO")

        .replace(/©/g,"0")

        .replace(/7\.,/g,"7,")

        .trim();

}

function extractRoute(text){

    const lines = text.split(/\n/);

    for(let line of lines){

        line = line
            .replace(/\s+/g," ")
            .trim();

        if(
            /\d{1,2}:\d{2}/.test(line)
            &&
            /[A-Z]{3}/.test(line)
        ){

            line = line.replace(
                /\s+0\.00\s*$/,
                ''
            );

            return line;
        }
    }

    return "Flight info not found";
}

function extractRows(text){

    const rows = [];

    const lines = text.split(/\n/);

    for(let line of lines){

        line = normalizeLine(line);

        const fareClassMatch =
            line.match(
                /\b[A-Z][0-9A-Z]?_ECO\b/i
            );

        if(!fareClassMatch)
            continue;

        const fareClass =
            fareClassMatch[0]
                .toUpperCase();

        if(
            !FARE_ORDER.includes(
                fareClass
            )
        ){
            continue;
        }

        const fareMatch =
            line.match(
                /\d{1,3}(?:,\d{3})+\.00/
            );

        if(!fareMatch)
            continue;

        const fare =
            parseMoney(
                fareMatch[0]
            );

        const afterFare =
            line.substring(

                line.indexOf(
                    fareMatch[0]
                ) +

                fareMatch[0]
                    .length

            ).trim();

        const availMatch =
            afterFare.match(
                /^(\d{1,3})\b/
            );

        if(!availMatch)
            continue;

        const availability =
            Number(
                availMatch[1]
            );

        rows.push({

            fareClass,
            fare,
            availability

        });

    }

    const clean = {};

    rows.forEach(r => {

        clean[
            r.fareClass
        ] = r;

    });

    return Object
        .values(clean)
        .sort(
            (a,b)=>
                a.fare-b.fare
        );

}
function calculateFromRows(rows, paxNeeded){

    let previousAvailability = 0;

    let remaining = paxNeeded;

    let total = 0;

    const detail = [];

    for(const row of rows){

        const bucketSeats =
            Math.max(
                0,
                row.availability -
                previousAvailability
            );

        previousAvailability =
            row.availability;

        const paxUsed =
            Math.min(
                remaining,
                bucketSeats
            );

        const amount =
            paxUsed *
            row.fare;

        detail.push({

            fareClass:
                row.fareClass,

            fare:
                row.fare,

            availability:
                row.availability,

            bucketSeats,

            paxUsed,

            amount

        });

        total += amount;

        remaining -= paxUsed;

        if(remaining <= 0)
            break;
    }

    return {

        detail,

        average:
            total / paxNeeded,

        total

    };
}

function renderParsedTable(
    tableId,
    rows
){

    let html = `
    <tr>
        <th>Fare Class</th>
        <th>Fare</th>
        <th>Availability</th>
    </tr>
    `;

    rows.forEach(r => {

        html += `
        <tr>
            <td>${r.fareClass}</td>
            <td>${money(r.fare)}</td>
            <td>${r.availability}</td>
        </tr>
        `;

    });

    document
        .getElementById(tableId)
        .innerHTML = html;
}

function renderResult(
    tableId,
    summaryId,
    result,
    legNo
){

    let html = `
    <tr>
        <th>Fare Class</th>
        <th>Fare</th>
        <th>Avail</th>
        <th>Bucket</th>
        <th>Pax Used</th>
        <th>Amount</th>
    </tr>
    `;

    result.detail.forEach(r => {

        html += `
        <tr class="${
            r.paxUsed===0
            ? 'zero'
            : ''
        }">
            <td>${r.fareClass}</td>
            <td>${money(r.fare)}</td>
            <td>${r.availability}</td>
            <td>${r.bucketSeats}</td>
            <td>${r.paxUsed}</td>
            <td>${money(r.amount)}</td>
        </tr>
        `;

    });

    document
        .getElementById(tableId)
        .innerHTML = html;

    const avg =
        money(
            result.average
        );

    document
        .getElementById(summaryId)
        .innerHTML = `
        <b>
        Average:
        ${avg}
        </b>
        `;

    legAverage[
        legNo
    ] = result.average;

    updateRoundTrip();
}

async function processLeg(
    legNo
){

    const file =
        document
        .getElementById(
            `imageInput${legNo}`
        )
        .files[0];

    if(!file){

        alert(
            `Choose image ${legNo}`
        );

        return;
    }

    const status =
        document.getElementById(
            `status${legNo}`
        );

    status.innerHTML =
        "OCR Processing...";

    const result =
        await Tesseract
        .recognize(
            file,
            "eng"
        );

    const text =
        result.data.text;

    document
        .getElementById(
            `ocrPreview${legNo}`
        )
        .innerText =
        text;

    const route =
        extractRoute(text);

    legRoute[
        legNo
    ] = route;

    document
        .getElementById(
            `route${legNo}`
        )
        .innerText =
        route;

    const rows =
        extractRows(text);

    renderParsedTable(
        `parsedTable${legNo}`,
        rows
    );

    const paxNeeded =
        Number(
            document
            .getElementById(
                "paxInput"
            ).value
        );

    const calc =
        calculateFromRows(
            rows,
            paxNeeded
        );

    renderResult(
        `resultTable${legNo}`,
        `summary${legNo}`,
        calc,
        legNo
    );

    status.innerHTML =
        "Done";
}

async function processBoth(){

    await processLeg(1);

    await processLeg(2);

}

function copyFinalResult(){
    document
        .getElementById(
            "roundTripSummary"
        )
        .innerText =

`Route: ${routeText}
Pax: ${pax}

OW Avg:
${legRoute[1]} = ${ow}

RT Avg:
${legRoute[2]} = ${rt}

Round Trip Avg:
${roundTrip}`;
}

function copyFinalResult(){

    const text =
        document
        .getElementById(
            "roundTripSummary"
        )
        .innerText;

    navigator
        .clipboard
        .writeText(text);

    alert(
        "Copied"
    );
}
async function login(){

    const user =
        document.getElementById(
            "username"
        ).value;

    const pass =
        document.getElementById(
            "password"
        ).value;

    const res =
        await fetch(
            `${API_URL}?action=login&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`
        );

    const txt =
        await res.text();

    if(txt === "OK"){

        currentUser = user;

        document
            .getElementById(
                "loginBox"
            )
            .style.display =
            "none";

        document
            .getElementById(
                "appArea"
            )
            .style.display =
            "block";

    }else{

        alert(
            "Sai Username hoặc Password"
        );

    }
}

async function saveLog(){

    if(currentUser === "")
        return;

    try{

        const pax =
            document
            .getElementById(
                "paxInput"
            ).value;

        await fetch(
            API_URL,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({

                    user:
                        currentUser,

                    flight1:
                        legRoute[1],

                    flight2:
                        legRoute[2],

                    pax:
                        pax,

                    owAvg:
                        money(
                            legAverage[1]
                        ),

                    rtAvg:
                        money(
                            legAverage[2]
                        ),

                    roundTrip:
                        money(
                            legAverage[1]
                            +
                            legAverage[2]
                        )

                })
            }
        );

    }catch(error){

        console.log(
            "Save Log Error",
            error
        );

    }
}
