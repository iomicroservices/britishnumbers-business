import './styleCompiler/ww-style-page-2d7c1cdf-523b-482f-acb1-275a95ab4875.css';
/*__WW_PAGE_COMPONENT_IMPORTS_START__*/

// eslint-disable-next-line no-undef
import element_21881619_a984_4847_81a9_922c3dbb5853 from "@weweb-internal/ext-element-21881619-a984-4847-81a9-922c3dbb5853";
import element_3a7d6379_12d3_4387_98ff_b332bb492a63 from "@weweb-internal/ext-element-3a7d6379-12d3-4387-98ff-b332bb492a63";
import element_6f8796b1_8273_498d_95fc_7013b7c63214 from "@weweb-internal/ext-element-6f8796b1-8273-498d-95fc-7013b7c63214";
import element_83d890fb_84f9_4386_b459_fb4be89a8e15 from "@weweb-internal/ext-element-83d890fb-84f9-4386-b459-fb4be89a8e15";
import element_b783dc65_d528_4f74_8c14_e27c934c39b1 from "@weweb-internal/ext-element-b783dc65-d528-4f74-8c14-e27c934c39b1";
import element_d7904e9d_fc9a_4d80_9e32_728e097879ad from "@weweb-internal/ext-element-d7904e9d-fc9a-4d80-9e32-728e097879ad";

// eslint-disable-next-line no-undef
import section_99586bd3_2b15_4d6b_a025_6a50d07ca845 from "@weweb-internal/ext-section-99586bd3-2b15-4d6b-a025-6a50d07ca845";

/*__WW_PAGE_COMPONENT_IMPORTS_END__*/

import { registerSsrPageComponents } from '@/_front/rendering/ssrPageComponents';

let isRegistered = false;

export default async function registerPageComponents(app) {
    if (isRegistered) return;

    if (import.meta.env.SSR) {
        await registerSsrPageComponents(
            app,
            // eslint-disable-next-line no-undef
            /*__WW_SSR_PAGE_COMPONENT_DESCRIPTORS_START__*/
[
    {
        "baseId": "21881619-a984-4847-81a9-922c3dbb5853",
        "importPath": "@weweb-internal/ext-element-21881619-a984-4847-81a9-922c3dbb5853",
        "name": "wwobject-21881619-a984-4847-81a9-922c3dbb5853",
        "type": "element"
    },
    {
        "baseId": "3a7d6379-12d3-4387-98ff-b332bb492a63",
        "importPath": "@weweb-internal/ext-element-3a7d6379-12d3-4387-98ff-b332bb492a63",
        "name": "wwobject-3a7d6379-12d3-4387-98ff-b332bb492a63",
        "type": "element"
    },
    {
        "baseId": "6f8796b1-8273-498d-95fc-7013b7c63214",
        "importPath": "@weweb-internal/ext-element-6f8796b1-8273-498d-95fc-7013b7c63214",
        "name": "wwobject-6f8796b1-8273-498d-95fc-7013b7c63214",
        "type": "element"
    },
    {
        "baseId": "83d890fb-84f9-4386-b459-fb4be89a8e15",
        "importPath": "@weweb-internal/ext-element-83d890fb-84f9-4386-b459-fb4be89a8e15",
        "name": "wwobject-83d890fb-84f9-4386-b459-fb4be89a8e15",
        "type": "element"
    },
    {
        "baseId": "b783dc65-d528-4f74-8c14-e27c934c39b1",
        "importPath": "@weweb-internal/ext-element-b783dc65-d528-4f74-8c14-e27c934c39b1",
        "name": "wwobject-b783dc65-d528-4f74-8c14-e27c934c39b1",
        "type": "element"
    },
    {
        "baseId": "d7904e9d-fc9a-4d80-9e32-728e097879ad",
        "importPath": "@weweb-internal/ext-element-d7904e9d-fc9a-4d80-9e32-728e097879ad",
        "name": "wwobject-d7904e9d-fc9a-4d80-9e32-728e097879ad",
        "type": "element"
    },
    {
        "baseId": "99586bd3-2b15-4d6b-a025-6a50d07ca845",
        "importPath": "@weweb-internal/ext-section-99586bd3-2b15-4d6b-a025-6a50d07ca845",
        "name": "section-99586bd3-2b15-4d6b-a025-6a50d07ca845",
        "type": "section"
    }
]
/*__WW_SSR_PAGE_COMPONENT_DESCRIPTORS_END__*/
        );
    } else {
        // eslint-disable-next-line no-undef
        app.component("wwobject-21881619-a984-4847-81a9-922c3dbb5853", element_21881619_a984_4847_81a9_922c3dbb5853);
app.component("wwobject-3a7d6379-12d3-4387-98ff-b332bb492a63", element_3a7d6379_12d3_4387_98ff_b332bb492a63);
app.component("wwobject-6f8796b1-8273-498d-95fc-7013b7c63214", element_6f8796b1_8273_498d_95fc_7013b7c63214);
app.component("wwobject-83d890fb-84f9-4386-b459-fb4be89a8e15", element_83d890fb_84f9_4386_b459_fb4be89a8e15);
app.component("wwobject-b783dc65-d528-4f74-8c14-e27c934c39b1", element_b783dc65_d528_4f74_8c14_e27c934c39b1);
app.component("wwobject-d7904e9d-fc9a-4d80-9e32-728e097879ad", element_d7904e9d_fc9a_4d80_9e32_728e097879ad);

        // eslint-disable-next-line no-undef
        app.component("section-99586bd3-2b15-4d6b-a025-6a50d07ca845", section_99586bd3_2b15_4d6b_a025_6a50d07ca845);
    }

    isRegistered = true;
}
