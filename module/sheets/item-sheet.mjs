import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ACItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ac2d20", "sheet", "item"],
            width: 520,
            height: 520,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
        });
    }

    /** @override */
    get template() {
        const path = "systems/ac2d20/templates/item";
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.html`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        return `${path}/item-${this.item.data.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        // Retrieve base data structure.
        const context = super.getData();

        // Use a safe clone of the item data for further operations.
        const itemData = context.item.data;

        // Retrieve the roll data for TinyMCE editors.
        context.rollData = {};
        let actor = this.object?.parent ?? null;
        if (actor) {
            context.rollData = actor.getRollData();
        }

        // Add the actor's data to context.data for easier access, as well as flags.
        context.data = itemData.data;
        context.flags = itemData.flags;

        context.effects = prepareActiveEffectCategories(this.item.effects);
        context.AC2D20 = CONFIG.AC2D20;


        // Prepare Aditional Data
        // if (itemData.type == 'apaprel') {
        //context.apparelTypes = CONFIG.AC2D20.APPAREL_TYPE;
        //}

        return context;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Weapon Qualities Toggle
        html.find(".wpn-focus-toggler").click(async (ev) => {
            let focusEl = $(ev.currentTarget).parent('.wpn-focus');
            let focusKey = focusEl.data('focusKey');
            let focusValue = !focusEl.data('focusValue');
            focusEl.data('focusValue', focusValue);
            let focusType = focusEl.data('focusType');
            let itemId = this.document.data._id;
            let flagKey = "";
            if (focusType == 'weaponQuality')
                flagKey = 'weaponQualities';
            else if (focusType == 'damageEffect')
                flagKey = 'damageEffects';
            let flags = duplicate(this.item.getFlag('ac2d20', flagKey));
            let box = focusEl.parent('.item-list');
            $(box.children()).each((q, i) => {
                let qu = flags[$(i).data('focusKey')];
                qu['value'] = $(i).data('focusValue');
            });
            await this.item.setFlag('ac2d20', flagKey, flags);
        });

        // Focus Rank Change
        html.find(".wpn-focus-rank").change(async (ev) => {
            let newRank = $(ev.currentTarget).val();
            let focusEl = $(ev.currentTarget).parent('.wpn-focus');
            let focusKey = focusEl.data('focusKey');
            let focusType = focusEl.data('focusType');
            let itemId = this.document.data._id;
            //let wpn = game.items.get(itemId);
            let flagKey = "";
            if (focusType == 'weaponQuality')
                flagKey = 'weaponQualities';
            else if (focusType == 'damageEffect')
                flagKey = 'damageEffects';
            let flags = duplicate(this.item.getFlag('ac2d20', flagKey));
            let box = focusEl.parent('.item-list');
            $(box.children()).each((q, i) => {
                let qu = flags[$(i).data('focusKey')];
                if (qu['rank'] != null)
                    qu['rank'] = newRank;
            });
            await this.item.setFlag('ac2d20', flagKey, flags);
        });

        // Effects.
        html.find(".effect-control").click(ev => {
            if (this.item.isOwned) return ui.notifications.warn("Managing Active Effects within an Owned Item is not currently supported and will be added in a subsequent update.")
            onManageActiveEffect(ev, this.item)
        });

        // DON't LET NUMBER FIELDS EMPTY
        const numInputs = document.querySelectorAll('input[type=number]');
        numInputs.forEach(function (input) {
            input.addEventListener('change', function (e) {
                if (e.target.value == '') {
                    e.target.value = 0
                }
            })
        });
    }
}