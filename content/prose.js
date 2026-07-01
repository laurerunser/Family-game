// prose.js — the reskinned, authored prose for the Signal-Weave setting.
// Titles + bodies + the three endings, keyed by document id. The puzzle CONTENT (who is
// named, what each clue forces) is unchanged from the source; only the imagery is recast
// from weaving-on-cloth to weaving-as-light-signal (the Weave / vaels / the Dark / aelry
// driftlights). Reverse "hidden_payload.text" is taken from the source unchanged and the
// engine lays it over a generated noise grid; the explicit Rosetta grid is rebuilt by the
// generator from the payload "SUVI".

export const TITLES = {
  d1: 'The Charge to the Reader',
  d2: 'The First Vael of Vethra',
  d3: 'The Roll of the Standing Warp',
  d4: "The Ward's Vael",
  d5: "The Even Hand's Accession",
  d6: "The Counter's Warrant",
  d7: "The Loud Loom's Petition",
  d8: 'The Household of the Ward',
  d9: 'Sifter, Scourer, Tinter',
  turn_rosetta: 'The Strand That Turns (Rosetta vael)',
  r1: "The Reverse of the Ward's Vael",
  r2: 'The Venn-Vau',
  r3: 'The Unwoven Renthe',
  r4: 'What the Open Face Carried',
  r5: 'A Knot Tied in the Dark',
  r6: 'The Loud Loom',
  r7: 'The Name the Vael Denied',
  c_rosetta: 'The Teaching Cord',
  c1: 'The Long Cords of the Counter',
  c2: "The Shears' Wage",
  c3: 'Sigils of the House',
  c4: 'The Funding Cord',
  c5: 'The Held Knot',
  c6: 'Instruction to the Even Hand',
  c7: 'The Offered Strand',
  c8: "The Factor's Cords",
  c9: "The Witness's Cord",
  d1_reread: 'The Charge, Read Again',
  c_final: 'The Three Faces',
};

export const BODIES = {
  d1: `[archivist's note: the opening vael, woven in a late hand into the Weave. The border-nael is the commissioning seal of our own order.]

To the reader set to this work: you hold the recovered vael of the Loomhouse of Oramei, that stood upon the ashen reach and is fallen. Its warp is broken and its weft scattered, and the threa of its people run into knots that no living hand remembers. You are charged to make them plain.

Read the vael, and set each name in its place. Mark who was nenne and who was suri, who was warp and who was weft, and who among them held the Loomhouse as Vara. Where the record is whole, trust it. Where it frays, follow the threa to its end.

This is a small and patient work, and a kind one. The gone of Oramei have lain long in the dark with their names unspoken. Give them back their places, and let the vael be closed.

[border-nael: the seal of the commissioning order]`,

  d2: `[archivist's note: the founding vael; the oldest in the recovered set.]

Here is set the first warp. Vethra raised the Loomhouse upon the ashen reach and was its first Vara; and Orel was her vau-o, who stood at the loom but did not hold it.

Of Vethra's body came her suri. First was Marenn, suri-a, who took the warp after her and was Vara in her turn. After Marenn came Suvi, suri-a also -- the quiet one, who wove but did not rule, tava-a to Marenn and second to the warp. [a worn line: after Suvi a third may have come, a suri-o, but the threa is lost to the fray.]

So the warp stood: Vethra, then Marenn; and the weft of the house spread from them.`,

  d3: `[archivist's note: a roll-vael, much amended -- later hands have worked over earlier ones.]

The warp passes thus: to the eldest veresh suri of Vethra's body, renthed upon the Great Loom at the Turning; and where none is named warn, to that eldest by birth. A suri-shen takes no warp, nor any who is not renthed.

After Marenn the warp came to her eldest, Edra, called the Loomwright, who was Vara in her turn. Edra left no suri; so it came aside to her tava-a, Solenne, the Even Hand, who holds the closing place upon this roll. A third of Marenn's body, Renor, was passed for the warp and is little named here.

[a later hand has added:] In the turning before, the ward of the house -- a weft-suri of no clear nenne -- was taken by fever and went into the dark, young and unrenthed. The house grieved, and the Even Hand steadied it. Let the vael remember her kindness.

So the warp was kept whole.`,

  d4: `[archivist's note: a small vael, finely woven, of a single child. The lower border-threa is not terminated -- it runs off the edge, as though the hand that wove it meant it to continue elsewhere.]

This is the ward of the house: a weft-suri, of no nenne the roll will name. She was given a threa-nenna to keep her -- Solenne, the Even Hand -- and a vela to teach her the loom, Caleth, called the Patient.

She was a quiet child, and quick at the threads. She did not live to be renthed.

[Here the weave should close with the dark-karn that marks the gone. It does not. The lower threa is carried off the edge of the vael, unbroken, and does not end.]`,

  d5: `[archivist's note: an accession-vael, in the same late hand as the charge.]

When Edra the Loomwright went into the dark, she left no suri to take the warp after her. So it passed aside, to her tava-a Solenne, called the Even Hand, who became Vara and closed this line.

It is written that she came to the loom in a hard turning. The house had lately grieved its ward, and the warp might have frayed in lesser hands. Solenne held it even. She was a threa-nenna who had buried the child she swore to keep, and she did not let her grief unsteady the Weave. The Threnne called her even-handed for it, and the name held.

So the warp was kept whole, and the Even Hand held the Loomhouse to its close.`,

  d6: `[archivist's note: a warrant-vael, with a counter's nael at the foot -- and, rare among these vaels, a reference to records not woven into the Weave but knotted into cords.]

To Tovesh, called the Counter, was given the keeping of the Karna: the house's debts and dues, its wages and its tithes. These the Counter did not weave but knotted, in karn -- cords of record, each sealed with the nael of the hand that owed or was owed.

It is said the Counter kept a close ledger, and would not let a knot go untied nor a count go false. What the Loom set down for all to read, the karn set down in number, for those who could read a cord.

The karn of Oramei are not among the vaels. Where they have gone, this warrant does not say.`,

  d7: `[archivist's note: a petition-vael, in a loud and crowded hand, much in the petitioner's own favour.]

Here Avesa, suri-a of Renor, sets her claim. Renor was suri-o of Marenn and was passed for the warp, and his suri after him; and Avesa would not be passed in silence.

She petitions that the warp, wanting a clear warn, should come to the cadet line -- to Renor's blood, and so to her. She names herself the truest weft of the standing warp and asks the vael to say so.

The vael does not say so. The warp went even to the Even Hand, and Avesa's loud claim was set down and not taken up. But it was set down, and it is here, in her own crowded hand, for any reader to find.`,

  d8: `[archivist's note: a household-vael, listing those who kept the ward's rooms.]

About the ward was set a small household. Closest was Ilse, called the Open Face, who was given to the child as companion and kept near her in all things -- at the loom, at the table, at the going to sleep. The vael names her open and faithful.

Under her were the common hands: Dav the Sifter, who sifted the house's stores; Tomas the Scourer; Yola the Tinter, who gave the pale strands their colour. These came and went and are little in the vael.

The ward, it is written, loved her Open Face best of all the house, and told her everything, as children do.`,

  d9: `[archivist's note: a common-vael, a tally of small years and small doings; useful chiefly for its turnings.]

The Sifter's tally keeps the turnings by the driftlights. In most turnings the aelry drift pale over the reach before the cold, and the house counts the turning by them.

But it is set here that in one turning the aelry did not come. The driftlights did not cross the reach, and the old hands called it an ill turning and would not say more. The next turning the house grieved its ward.

Such things the common vaels keep, that the great vaels think too small to hold: which turning the aelry came, and which turning they did not, and what came after.`,

  turn_rosetta: `[Shown at the Turn: the ward's strand runs unbroken off the edge of the vael, and the game prompts INVERT THE SIGNAL. This vael is shown front, then inverted. On the reverse most strands are carried (noise); a few are tied off (marked). Read the tied-off strands in reading order. They spell a name you already know -- and reveal who has been speaking from the venn, the underside. This teaches the rule before Stage 2 requires it.]`,

  r1: `[archivist's note: inverted, the vael carries a second weaving, worked in the tied-off strands -- a hand speaking from the venn, the underside. Read the knotted strands; let the carried ones lie.]

If you have inverted this vael, then the Even Hand sits where my daughter should, and I am long shorn and past her reach. Good. Read close, and read slow. I had little thread, and less time.

The front is mine. I wove every lie of it with these hands, because the other road was the shears. But a vael has two faces, and they did not think to read the one that lies against the wall.

She was no ward. She was my suri, veresh, of my body and of a vau they would not let me keep -- a venn-vau, bound in the dark to Talis, who was shen to this house and is gone dark before me. I renthed her myself. I stood at the Turning and tied her first knot with my own hand, and I gave her her name. Her name was Nemora.

They unwove it. They cut her renthe from the vael and called her a ward of no nenne; they called her dying a fever. It was not a fever. My girl was mis-shorn. I know the weight of that word, and I do not set it down lightly: she was cut, and out of turn, and by a hand inside this house.

I could not save her. I could only keep her -- threa-kept, in the one place they would not look. I have kept her name here, and her face, and the fact of her, against the day a reader like you would invert the signal and let her up.

I do not know whose hand held the shears. I was taken before I learned it, and I will not weave a name I cannot prove. But the Karna knots what the Loom dares not weave. If Tovesh's karn survive, the hands are in the knots. Go to the cords. I ran out of thread before the names.

You will not. Keep her with me, reader. Finish what I could not.`,

  r2: `[the reverse of a marriage-vael; the same hand, from the venn.]

You will want it proven, reader, for the warp turns on it. So: my vau to Talis was no half-thing, no suri-shen's excuse. It was true, and it was bound.

We could not stand at the Turning before the house -- they would have cut him from the reach, shen that he was. So we bound it in the dark, a venn-vau; but we bound it whole, with the words said, and a knot tied that holds, and one to witness it who is past their reach now. Talis was my true vau. Nemora came of that binding, veresh, of two who were wed.

They will tell you she was suri-shen, got in no marriage. They lie. I was there. I tied the knot. Read this vael's reverse close and you will find the witness's nael beside mine, where the front carries only dark.`,

  r3: `[the reverse of the roll; the hand grown smaller, as if hurried.]

Now the hardest thread, the one they buried deepest. Read slow.

I was Vethra's first. Not Marenn -- me. I came of my nenne's body before my tava, and the warp was mine to hold. But I would not give up Talis, and a Vara may not bind a shen, they said. So they wove Marenn before me, and set me at the loom, and called it my own choosing. It was not my choosing. They took the warp from my hand and wrote that I had opened it.

And my Nemora -- I renthed her. I stood at the Turning, before what witnesses I could trust, and tied her into the Great Loom with my own hand: veresh and renthed, second only to me, and so first after me to the warp. Then they unwove it. They cut her renthe out of the vael as you would cut a fault from a weave, and where she had been they set a nameless ward.

She was the warp, reader. My girl was the warp. Remember it.`,

  r4: `[the reverse of the household-vael.]

Let me give you the ones who loved her, before I give you the cords, so you know what was lost and not only who did the losing.

Ilse. Her Open Face. The front says companion, and that is true and far too small. They were sevi -- sworn, the two of them, in the way children swear and mean it more than grown hands do. Ilse kept my girl's secrets and my girl kept hers; and when Nemora slipped away to Dris in the dark, it was Ilse who watched the door.

I set this down kindly, reader. Hold it kindly a while. When you come to the cords you may not be able to any longer, and I would have you have loved Ilse first.`,

  r5: `[the reverse of a small unmarked vael.]

Dris. A Farcomer, shen like his Talis before him -- my girl loved as I loved, outside the Weave, in the dark. He was her velsa, and I will not pretend I minded. I had bound my own knot in the dark and got a daughter of it; I would not grudge her the same gladness, in the little time they had it.

He is why you can read any of this. When it went wrong -- when she was cut and I was taken -- it was Dris who went to Tovesh's keeping and took what the Counter would not falsify. He carried the cords off the reach in his own hands. If they reach you, reader, they reach you because a shen boy loved my girl enough to run.

Find the cords. He kept them for you. He kept her for you.`,

  r6: `[the reverse of the petition-vael; a single bitter line of knots beside Avesa's loud weave.]

And Avesa. You will have read her crowded claim on the front, and you will suspect her -- I did. She wanted the warp, openly, the way a child wants, with both hands out. She is rivenn, and she made no secret of it; she stood in the hall and said the warp was owed to her blood.

So when my girl went under, the house looked at Avesa, and so will you. Keep her in your eye, reader. But keep this beside her: a hand that wants the warp with both hands out, in the open hall, is not always the hand that ties the knot in the dark. Loud is not the same as guilty. I learned that too late to do my girl any good. Learn it sooner.`,

  r7: `[the last of the reverse; the hand failing now, the knots loose and few.]

I am near the end of my thread, reader. They do not let me near a loom any longer; I have woven this where I could, against the day. Let me give you the last thing -- the thing the cords are locked to.

I do not know whose hand held the shears. I have told you so. But I know how to open Tovesh's cords, for the Counter and I were both kept things in this house, and kept things learn each other's locks.

The karn answer to a name. They answer to the name this vael was made to deny -- to Nemora. Set her name against the knots and the knots will speak. And the deepest cords, the ones that go outside this house, to the hand behind the Even Hand -- those answer to two names twined: my girl's, and her father's. Nemora and Talis. The two they tried hardest to unweave are the key to all of it. They did not see the joke of that. I did. I am laughing, reader, where they cannot see.

Go to the cords. Keep her with me. Finish it.`,

  c_rosetta: `[Tied to the outside of the recovered bundle: a short cord. It is the label the Counter tied to his own ledgers. Set the name from the reverse (NEMORA) against its knots, subtracting the key, and it speaks a word you already know -- proving the method before anything is at stake.]`,

  c1: `[A thick sheaf of numeric cords -- wages and dues, in plain count, needing no key. Most are small and routine: payments to Dav the Sifter, Tomas the Scourer, Yola the Tinter, turning by turning. But one cord is long and large, and dated: a single payment, in the turning the house grieved its ward (the turning after the aelry did not come). Read the money first; then find whose nael it is paid to.]`,

  c2: `[A lettered cord tied to the large payment. Keyed with NEMORA it names the recipient; cross-check the nael on the payment (c1) against the sigil-key (c3). The ward's own vela, the Patient, was paid 300 in the murder turning.]`,

  c3: `[Not a ciphered cord but a key-cord: a row of naels with the names knotted plainly beside them -- the Counter's index of whose mark is whose. Note that Avesa's nael differs from Solenne's by a single knot; that ambiguity is what the forged cord (c7) leans on.]`,

  c4: `[A numeric cord recording money IN, not out -- into a sub-account the public ledger does not show. The sender nael is not in the house sigil-key (c3): the money does not start in the Loomhouse. 320 in, 300 out -- the skim a counter who would not let a count go false could not bring himself to hide.]`,

  c5: `[A lettered cord bearing two naels -- Solenne's over Ilse's. Keyed with NEMORA it names what was held. Ilse, the ward's sevi who watched the door, carried the child's movements not for gain but under threat to her own infant.]`,

  c6: `[A lettered cord bearing the unknown outside nael as sender, addressed to Solenne's nael. Keyed with NEMORA it reads as an order. The instruction to remove the ward came TO Solenne, from the same outside hand that funded the wage (c4): she is the usurper who took the warp by the killing, and she was directed from outside -- a vara-set. The obvious mastermind is a puppet.]`,

  c7: `[A cord that, taken at face value, names Avesa as the payer of Caleth -- the ready-made scapegoat. It bears Avesa's nael (the near-match to Solenne's). But it does not behave like the others: keyed with the TRUE key NEMORA it decodes to gibberish, because the forger lacked the key and recorded AVESA in plain count to frame her. A player who applies NO key reads AVESA -- the trap. The lesson: the real cords are keyed and this one is not. It is a false-karn; Avesa is the patsy.]`,

  c8: `[A separate, finer bundle, knotted in a foreign hand and locked tighter than the rest: these go outside the house, to the hand behind the Even Hand. The Loomhouse name will not open them. They answer only to the two names twined -- NEMORA and TALIS -- the assembled key. The first short cord proves the assembled key works (it reads TALIS, a name you hold); the next names the prime mover, and bears the heir-nael that will matter at the very end.]`,

  c9: `[One cord is not the Counter's. It is tied in a plainer, outside hand, added last -- the only knot in the bundle that speaks for itself. Keyed with NEMORA it gives a name; knotted slow beside it, unpractised: that he took the Counter's cords the night she was cut, because they were the only true thing left in the house; that he carried them off the reach and kept them; that he did not know if any reader would ever come, but tied this so that if one did, they would know who kept her. Dris escaped -- which is why the cords exist at all.]`,

  d1_reread: `[With the Factor's cords open and the Outloom's heir-nael now read, the game returns you to the very first vael. The border-nael on d1 -- the commissioning seal of 'our own order', ignorable decoration at the start -- is the Outloom's heir-nael. It matches. The order that charged you to restore the genealogy is the heir of the power that funded the murder and wove the forgery. The restoration was meant to launder the lie. You have reconstructed the indictment of your own masters.]`,

  c_final: `[The conspiracy graph completes -- assassin (Caleth), coerced spy (Ilse), conduit-paymaster (Tovesh), installed usurper (Solenne), the Factor, and prime mover (the Outloom); witness (Dris); patsy cleared (Avesa); true heir restored (Nemora). The charge from d1 is answered. Then the last choice: you hold a truth that destroys the order that holds your leash, and must decide what becomes of it by choosing which medium to commit it to. The medium is the meaning.]`,
};

// The three endings (the finale's medium-choice). Keyed by ending id (front/reverse/cords).
export const ENDINGS = {
  front: `You take the truth to the Great Loom -- the public face, the medium they used to unmake her -- and you weave it there, in the open, where the front cannot be turned away from: Nemora, veresh and renthed, first after Suvi, the warp; mis-shorn by the Even Hand at the Outloom's word; and the order that sent you, named at the foot where its own nael sits.

It is the loudest thing you could do, and the most dangerous. The front is the one vael they cannot let stand, and they will know your hand wove it. You will not have long. But for as long as it stands in the Weave, anyone who comes to read the Loomhouse will read her true -- not a nameless ward, not a fever, but a girl who was the warp, and the hands that cut her. You have given her back her place, in the open, and let the vael be closed the way the charge first asked -- and never meant.`,

  reverse: `You do what Suvi did. You weave the truth into the back of a quiet vael, in the tied-off strands, where it will lie against the wall and wait -- not for the house that rules now, which would only unweave it again, but for a reader further on than you, with patience and an inverted signal and time.

You will not see the day it is read. Neither did she. You add your knots beneath hers, and the chain that began with a silenced mother weaving her murdered girl into the underside of her own lie runs one length longer, in your hand. It is not justice. It is keeping -- threa-kept, the word she gave you -- the truth held safe in the dark against a better day, and the trust that the day will come. You become, in the end, what she was: a hand on the reverse, speaking to a reader you will never meet. Keep her, the vael said. You keep her.`,

  cords: `You take the truth to the cords -- to number, to the medium that does not hang in any hall, that says what it says only to a hand that holds the key. You knot it whole: the names, the wage, the funding, the hand behind the Even Hand. And then it is yours.

What you do with it after, the game does not weave for you. A knotted truth is a quiet power: it can be buried, and let the girl lie unspoken in the dark a while longer; or it can be kept close, against the order that holds your leash, a knot you alone can read and they cannot afford you to read aloud. You have not given her back her place. You have not passed her on. You have made her a thing held -- the way the Counter held his honest count, the way they held a mother and a baby and a stolen warp. Whether that is the worst thing in this story or the only safe one, you are left to decide, with the cord in your hand and the reach going dark.`,
};
