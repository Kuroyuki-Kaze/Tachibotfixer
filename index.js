const Discord = require('discord.js');
const client = new Discord.Client();

const { token } = require('./config.json');
var prefix = "??"
const https = require('follow-redirects').https;

var sendableLink;
var sendableLinks = [];
var sendableLinkMessage;
var i = 0;
var foundarray;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

function pushLinks() {
    sendableLinks.push(sendableLink);
}

function doPostRequest() {
    PostRequest(foundarray[i]);
    if (i < foundarray.length) {
        setTimeout(() => {
            pushLinks();
            setTimeout(doPostRequest, 200);
            i++;
        }, 3000)
    }
}

client.on('message', msg => {
    const { content } = msg;
    if (content === `${prefix}ping`) {
        msg.channel.send("Pong!");
    } else if (content === `${prefix}msgauthor`) {
        msg.channel.send(`${msg.author.username}`);
    } else if (msg.author.id === "362571196425961472" && content === "fuck you") {
        msg.channel.send("Fuck you too.")
    } else if ((msg.author.id === "547050799164030976" || msg.author.id === "362571196425961472") && content.startsWith("https://anilist.co/manga/")) {
        //else if (msg.author.id === "362571196425961472" && content.startsWith("https://anilist.co/manga/"))  {
        //console.log("Received message.");
        var links = content;
        //console.log("Captured message.");
        foundarray = links.match(/((?<=https:\/\/anilist\.co\/manga\/)(\d+)?)/gm);
        //var foundstring = String(foundarray);
        //console.log(foundarray);
        //console.log(foundstring);
        //console.log(links);
        //console.log(foundarray.length);
        doPostRequest();
        setTimeout(() => {
            sendableLinkMessage = sendableLinks.join("\n");
            msg.channel.send(sendableLinkMessage);
            sendableLink = undefined;
            sendableLinks = [];
            sendableLinkMessage = undefined;
            i = 0;
            foundarray = undefined;

        }, foundarray.length * 3300);

        /*for (;i<foundarray.length;i++) {
            console.log("Sending post request" + String(i) + ".");
            //console.log(foundarray[i]);
            PostRequest(foundarray[i]);
            console.log("Set timeout for 3000 ms.")
            setTimeout(() => {
                msg.channel.send(sendableLinks);
                console.log("Sent message.")
            }, 3000);
        }*/
    }
});

async function PostRequest(someid) {
    var requestid = someid;

    var options = {
        'method': 'POST',
        'hostname': 'graphql.anilist.co',
        'path': '/',
        'headers': {
            'Content-Type': 'application/json; charset=utf-8',
        },
        'maxRedirects': 20
    };

    var req = https.request(options, function(res) {
        var chunks = [];

        res.on("data", function(chunk) {
            chunks.push(chunk);
            //console.log("Pushed Chunk for request number " + String(i) + ".")
        });

        res.on("end", function() {
            var body = Buffer.concat(chunks);
            //console.log("Concatenated chunks for request number " + String(i) + ".")
            var bodyString = String(body);
            const re = /(?<=\"romaji\"\:)(\"(.*?)\")/;
            //console.log("Perfomed regex on request number " + String(i) + ".");
            var found = bodyString.match(re)[2];
            var foundString = String(found);
            var linkidString = String(requestid);
            var foundString2 = foundString.replace(/[^\sA-Za-z]/g, "");
            var foundString3 = foundString2.replace(/\s/g, "-");
            sendableLink = "https://anilist.co/manga/" + linkidString + "/" + foundString3;
            //console.log("Returning variable sendableLink number " + String(i) + ".")
            return sendableLink;

        });

        res.on("error", function(error) {
            console.error(error);
        });
    });

    var postData = JSON.stringify({
        query: `query ($id: Int) {
    Media (id: $id, type: MANGA) {
        id
        title {
        romaji
        english
        native
        }
    }
    }`,
        variables: { "id": requestid }
    });

    req.write(postData);

    return await req.end();

}
client.login(token);