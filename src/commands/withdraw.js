var { psc, bot } = require('../../index.js');
var { colors, pearl, pearlify, emojis, formatify, caps } = require('../assets');
const { Catch, Econner, Clanner } = require('../classes');

const { Soup } = require('stews');


async function data(ctx, cmd) {
    var econner = new Econner();
    var clans = new Clanner();

	let [id, amount] = cmd.args;
	
	amount = formatify(amount);
	

	if ( 
    	Catch( cmd.onCooldown, { 
			head: `Woah there!  :face_with_spiral_eyes:`,
			text: `You can use this command again ${ cmd.cooldown.relative }`,
			time: cmd.cooldown.time
		}) ||

        Catch( !econner.has(ctx.author.id) || econner.fetchHand(ctx.author.id) <= 0, { text: "You don't have any pearls to withdraw." }) ||
		Catch( !amount, { text: "Please put an amount to withdraw."}) ||
		Catch( !parseInt(amount) && amount.toLowerCase() != "all", { text: "The amount has to be a number or all." }) ||
		Catch( !id, { text: "Please put a clan ID to withdraw the funds from."}) ||
		Catch( !clans.has(id), { text: "There is no clan with that ID" })
		
    ) return;


	let bal = econner.fetchHand(ctx.author.id);
    let clan = clans.fetch(id, ctx.guild.id);
	

	if (amount.toLowerCase() == "all") amount = clan.funds;
	amount = parseInt(amount);


	if (
		Catch( ctx.author.id != clan.owner, { text: "Only the owner of the clan can take out funds." }) ||
		Catch( bal >= caps.max, { text: "You can't hold anymore." }) ||
		Catch( amount > clan.funds, { text: "Clan doesn't have enough for that." }) ||
		Catch( amount <= 0, { text: "Invalid amount" })
	) return;


	if (bal+amount >= caps.max) amount = caps.max - bal;

	
	const embed = new psc.Embed({
		description: `${emojis.success} Withdrew ${"`"+pearl}${pearlify(amount)+"`"} from ${clan.name} (${"`"+id+"`"}) ${ (bal+amount == caps.max) ? "(max amount reached)" : ""}`,
		footer: { text: `( User Balance: ${pearl}${pearlify(bal+amount)} )\n( Clan Funds: ${pearl}${pearlify(clan.funds-amount)} )`, icon: psc.author.avatar() },
		color: colors.success
	});
	

	ctx.reply({ embeds: [embed] }).catch(e=>{});
	econner.withdraw(amount, ctx.author.id, id, ctx.guild.id);
}


psc.command({ name: "withdraw", aliases: ["with"], cooldown: "5s"}, data);
