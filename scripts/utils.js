import 'regenerator-runtime/runtime'
import FastAverageColor from 'fast-average-color';
const fac = new FastAverageColor();


module.exports = {
    updateTitle:function(text){
        if(!text){
            let time = new Date().getHours()
            let emojis = [
                [9, "🌅"],
                [12, "🏙️"],
                [17, "🌇"],
                [19,"🌆"],
                [21,"🌃"],
            ]
    
            for(let i = 0; i < emojis.length; i++){
                if(time >= emojis[i][0]  ){ text = emojis[i][1] }
            }
        }
    
        const canvas = document.createElement('canvas');
        canvas.height = 32;
        canvas.width = 32;
    
        const ctx = canvas.getContext('2d');
        ctx.font = '28px serif';
        ctx.fillText(text, -2, 24);


        const favicon = document.querySelector('link[rel=icon]');
        if (favicon) { favicon.href = canvas.toDataURL(); }
    },

    fetchChangelog:async function(){
        try{

            let changelogUrl = await fetch("https://raw.githubusercontent.com/LukeGotBored/CastView/master/assets/changelog.json")
            let changelogData = await changelogUrl.json()
            // console.log(changelogData)
            return changelogData
        } catch(e){
            console.log("[!] Couldn't fetch changelog")
            return false;
        }
    },

    loadImage:async function(url) {
        var img = new Image();
        // load image using await
        return new Promise(function(resolve, reject) {
            img.onload = function() {
                resolve(img);
            };
            img.src = url;
        });
    },

    getAverageColor:async function(img){
        let loadedImg = await this.loadImage(img)
        let color = fac.getColor(loadedImg)
        return color

    },
}