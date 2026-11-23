UPDATE registration_2027_bot_config
SET greeting = replace(greeting, 'Cikgu Wanwan BOT', 'Delima PTG BOT'),
    faq_json = replace(faq_json, 'Cikgu Wanwan BOT', 'Delima PTG BOT')
WHERE instr(greeting, 'Cikgu Wanwan BOT') > 0 OR instr(faq_json, 'Cikgu Wanwan BOT') > 0;
