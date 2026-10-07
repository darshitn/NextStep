const token = name => `rgb(var(--${name}) / <alpha-value>)`;
const neutralAccent = {50:token('soft'),100:token('soft'),200:token('border'),300:token('muted'),400:token('muted'),500:token('accent'),600:token('accent'),700:token('ink'),950:token('soft')};
export default {
 content:['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
 theme:{extend:{colors:{
 background:token('page'),white:token('surface'),'on-accent':token('inverse'),
 surface:{50:token('soft'),100:token('surface'),200:token('soft'),300:token('border')},
 brand:neutralAccent,emerald:neutralAccent,indigo:neutralAccent,purple:neutralAccent,blue:neutralAccent,amber:neutralAccent,rose:neutralAccent,
 slate:{100:token('soft'),200:token('border'),300:token('border'),400:token('muted'),500:token('muted'),600:token('muted'),700:token('ink'),800:token('ink'),900:token('ink'),950:token('ink')}
 },fontFamily:{sans:['Inter','system-ui','sans-serif']},boxShadow:{glass:'0 2px 8px #00000006',glow:'none'}}},plugins:[]
};
