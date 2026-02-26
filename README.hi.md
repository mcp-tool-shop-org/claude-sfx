<p align="center">
  <img src="assets/logo.png" width="400" alt="Claude-SFX">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/claude-sfx"><img src="https://img.shields.io/npm/v/claude-sfx" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-sfx/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

प्रक्रियात्मक ऑडियो प्रतिक्रिया [क्लाउड कोड] (https://docs.anthropic.com/en/docs/claude-code) के लिए। प्रत्येक टूल कॉल, फ़ाइल संपादन, खोज, गिट पुश और एजेंट डिस्पैच के लिए एक अलग ध्वनि होती है - जो ऑडियो फ़ाइलों के बजाय गणित से उत्पन्न होती है।

## शुरुआत कैसे करें

```bash
npm install -g claude-sfx
cd your-project
claude-sfx init       # install hooks into .claude/settings.json
claude-sfx demo       # hear all 7 verbs
```

बस इतना ही। क्लाउड कोड अब काम करते समय ध्वनियाँ बजाएगा।

## ऑडियो प्रतिक्रिया क्यों?

जब कोई एआई एजेंट आपकी ओर से पढ़ता है, लिखता है, खोज करता है और तैनात करता है, तो आप दृश्यता खो देते हैं। आप केवल टेक्स्ट को स्क्रॉल होते हुए देखते हैं। ऑडियो प्रतिक्रिया जागरूकता बहाल करती है:

- **पहुंच** - टर्मिनल देखने के बिना स्थिति परिवर्तन, त्रुटियों और पूर्णता को सुनें
- **प्रवाह** - किसी परीक्षण के पास होने या किसी पुश के सफल होने के बारे में संदर्भ बदलने के बिना जानें
- **उपस्थिति** - एजेंट एक सहयोगी की तरह महसूस होता है, न कि एक ब्लैक बॉक्स की तरह

## 7 क्रियाएँ

प्रत्येक क्लाउड कोड क्रिया 7 मुख्य क्रियाओं में से एक से मेल खाती है। संशोधक (स्थिति, दायरा, दिशा) ध्वनि को बदलते हैं लेकिन सामंजस्य को नहीं तोड़ते।

| Verb | ट्रिगर | Sound |
|---|---|---|
| **इनपुट** | `पढ़ें`, `वेबफेच`, `वेबखोज` | हल्की बढ़ती हुई साइन वेव - कुछ आ रहा है |
| **परिवर्तन** | `Edit` | एफएम-टेक्सचर्ड पल्स - पुन: आकार देना |
| **कमीट** | `लिखें`, `नोटबुकएडिट`, `गिट कमिट` | तीव्र स्टैम्प टोन - सील |
| **नेविगेट** | `grep`, `glob` | सोनार पिंग - स्कैनिंग |
| **निष्पादित करें** | `बैश`, `npm टेस्ट`, `tsc` | शोर विस्फोट + टोन - यांत्रिक क्रिया |
| **स्थानांतरित करें** | `mv`, `cp`, सबएजेंट स्पॉन | हवा की सरसराहट - वायु विस्थापन |
| **सिंक** | `गिट पुश`, `गिट पुल` | नाटकीय सरसराहट + टोनल एंकर |

### संशोधक

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
```

### स्मार्ट बैश डिटेक्शन

हुक हैंडलर सही ध्वनि चुनने के लिए बैश कमांड की जांच करता है:

| बैश कमांड | Verb | स्थिति |
|---|---|---|
| `git push` | सिंक (ऊपर) | एग्जिट कोड से |
| `git pull` | सिंक (नीचे) | एग्जिट कोड से |
| `npm टेस्ट`, `pytest` | निष्पादित करें | एग्जिट कोड से |
| `tsc`, `npm रन बिल्ड` | निष्पादित करें | एग्जिट कोड से |
| `mv`, `cp` | move | — |
| `rm` | move | warn |
| सब कुछ और | निष्पादित करें | एग्जिट कोड से |

## प्रोफ़ाइल

ध्वनि पैलेट जो एक झंडे के साथ पूरे चरित्र को बदल देते हैं।

| प्रोफ़ाइल | चरित्र |
|---|---|
| **न्यूनतम** (डिफ़ॉल्ट) | साइन-वेव टोन - सूक्ष्म, पेशेवर, दैनिक उपयोग के लिए |
| **रेट्रो** | स्क्वायर-वेव 8-बिट चीप्स - मजेदार लेकिन नियंत्रित |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### कस्टम प्रोफाइल

`profiles/minimal.json` की प्रतिलिपि बनाएँ, संश्लेषण मापदंडों को संपादित करें, और इसे लोड करें:

```bash
claude-sfx play navigate --profile ./my-profile.json
```

JSON में प्रत्येक संख्या सीधे सिंथ इंजन से मेल खाती है - वेवफॉर्म, आवृत्ति, अवधि, लिफाफा (ADSR), FM गहराई, बैंडविड्थ, गेन।

## अनायासता-रोधी

एक उत्पाद को एक खिलौने से अलग करने वाली चीज़।

| फ़ीचर | व्यवहार |
|---|---|
| **Debounce** | एक ही क्रिया 200ms के भीतर → एक ध्वनि |
| **Rate limit** | प्रति 10-सेकंड विंडो में अधिकतम 8 ध्वनियाँ |
| **Quiet hours** | कॉन्फ़िगर किए गए घंटों के दौरान सभी ध्वनियाँ बंद |
| **Mute** | तत्काल टॉगल, सत्र रीस्टार्ट से बचता है |
| **Volume** | 0–100 गेन नियंत्रण |
| **Per-verb disable** | उन विशिष्ट क्रियाओं को बंद करें जिन्हें आप नहीं चाहते हैं |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```

## एम्बिएंट (लंबे समय तक चलने वाले ऑपरेशन)

उन कमांड के लिए जो कुछ समय लेते हैं (बिल्ड, तैनाती, बड़े परीक्षण सूट):

```bash
claude-sfx ambient-start     # low drone fades in
# ... operation runs ...
claude-sfx ambient-resolve   # drone stops, resolution stinger plays
claude-sfx ambient-stop      # stop drone silently (no stinger)
```

## सत्र ध्वनियाँ

```bash
claude-sfx session-start     # two-note ascending chime (boot)
claude-sfx session-end       # two-note descending chime (closure)
```

## सभी कमांड

```
Setup:
  init                            Install hooks into .claude/settings.json
  uninstall                       Remove hooks

Playback:
  play <verb> [options]           Play a sound (goes through guard)
  demo [--profile <name>]         Play all 7 verbs
  preview [profile]               Audition all sounds in a profile
  session-start / session-end     Chimes
  ambient-start / ambient-resolve / ambient-stop

Config:
  mute / unmute                   Toggle all sounds
  volume [0-100]                  Get or set volume
  config                          Print current config
  config set <key> <value>        Set a value
  config reset                    Reset to defaults
  config repo <profile|clear>     Per-directory profile override
  disable / enable <verb>         Toggle specific verbs
  export [dir] [--profile]        Export all sounds as .wav files
```

## यह कैसे काम करता है

कोई भी ऑडियो फ़ाइल नहीं। प्रत्येक ध्वनि रनटाइम पर गणित से संश्लेषित होती है:

- **ऑसिलेटर** — साइन, स्क्वायर, सॉटूथ, त्रिकोण, सफेद शोर
- **एडीएसआर एनवलप** — अटैक, डीके, सस्टेन, रिलीज
- **एफएम सिंथेसिस** — बनावट के लिए आवृत्ति मॉडुलन
- **स्टेट-वेरिएबल फिल्टर** — "वूश" ध्वनि के लिए बैंडपास-फिल्टर किया गया शोर
- **फ्रीक्वेंसी स्वीप** — गति के लिए रैखिक इंटरपोलेशन
- **लाउडनेस लिमिटर** — सॉफ्ट-नी कंप्रेशन, हार्ड सीलिंग

यह पूरा पैकेज लगभग 2,800 लाइनों का टाइपस्क्रिप्ट कोड है और इसमें कोई भी उत्पादन निर्भरता नहीं है। ध्वनियाँ पीसीएम बफर के रूप में उत्पन्न होती हैं, मेमोरी में WAV में एन्कोड की जाती हैं, और ऑपरेटिंग सिस्टम के मूल ऑडियो प्लेयर के माध्यम से चलाई जाती हैं (विंडोज पर पॉवरशेल, macOS पर एफ्प्ले, लिनक्स पर एप्ले)।

## आवश्यकताएं:

- Node.js 18+
- क्लाउड कोड
- सिस्टम ऑडियो आउटपुट (स्पीकर या हेडफ़ोन)

## लाइसेंस:

[एमआईटी](LICENSE)
