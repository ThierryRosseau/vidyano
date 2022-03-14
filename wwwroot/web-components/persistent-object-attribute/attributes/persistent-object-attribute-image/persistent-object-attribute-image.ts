import * as Polymer from "../../../../libs/polymer/polymer";
import "../../../button/button"
import { Icon } from '../../../icon/icon.js';
import { WebComponent } from "../../../web-component/web-component"
import { PersistentObjectAttribute } from "../../persistent-object-attribute"
import { PersistentObjectAttributeImageDialog } from "./persistent-object-attribute-image-dialog"

Icon.Add
`<vi-icon name="ImageUpload">
    <svg viewBox="0 0 32 32">
        <g>
            <path d="m 19.614079,3.2046995 0,5.909369 c -1.97001,8.3e-4 -3.940507,7.33e-4 -5.910932,0.0016 4.14e-4,1.0920095 4.14e-4,2.1829885 0,3.2749965 1.970425,8.31e-4 3.940922,7.33e-4 5.910932,0.0016 -4.15e-4,1.969598 0,3.939771 0,5.909369 1.092008,8.31e-4 2.184136,-4.09e-4 3.276559,0 4.15e-4,-1.970007 0,-3.939361 0,-5.909369 1.97001,-4.2e-4 3.93936,4.1e-4 5.90937,0 l 0,-3.2765595 c -1.97001,-4.09e-4 -3.93936,0 -5.90937,0 -8.29e-4,-1.970417 9.38e-4,-3.940913 -0.0016,-5.910931 -1.092008,0.0014 -2.182989,-4.2e-4 -3.274997,0 z M 3.2000323,9.1156305 c 7.85e-4,6.5599345 -0.00134,13.1197455 0.00156,19.6796695 6.5628295,-0.0017 13.1262137,-0.0011 19.6890437,-0.0016 4.15e-4,-2.840958 -4.13e-4,-5.681321 0,-8.521868 -1.092421,-8.3e-4 -2.184136,0 -3.276559,0 -4.15e-4,1.748948 -7.33e-4,3.498332 -0.0016,5.246871 l -13.1249883,0 c -8.29e-4,-4.375497 4.15e-4,-8.751465 0,-13.126551 1.7489552,-8.3e-4 3.4979151,-7.32e-4 5.2468703,-0.0016 -4.15e-4,-1.092008 -4.15e-4,-2.182987 0,-3.2749965 -2.8446958,-8.29e-4 -5.6896729,0 -8.5343672,0 z M 16.556269,14.037501 c -0.07676,0.0062 -0.154516,0.01895 -0.229687,0.04062 -0.503907,0.12525 -0.902584,0.575514 -0.965624,1.090625 -0.0647,0.439209 0.117534,0.902441 0.460937,1.18281 0.237231,0.199071 0.548416,0.306562 0.857812,0.301563 0.391514,4.1e-4 0.773292,-0.197269 1.010936,-0.50625 0.294051,-0.36829 0.356917,-0.900426 0.164062,-1.329685 -0.211205,-0.50225 -0.761122,-0.823201 -1.298436,-0.779687 z m -5.476557,0.321875 c -1.0920077,3.281417 -2.1893355,6.561903 -3.279684,9.84374 3.608229,-0.0048 7.21676,0.0023 10.824989,-0.0047 -0.656947,-1.419239 -1.311483,-2.839702 -1.967185,-4.259371 -0.436306,0.876349 -0.873193,1.752721 -1.314061,2.62656 -1.419237,-2.736447 -2.843577,-5.470614 -4.264059,-8.206241 z" />
        </g>
    </svg>
</vi-icon>`;

@WebComponent.register({
    properties: {
        hasValue: {
            type: Boolean,
            computed: "_computeHasValue(value)"
        },
        image: {
            type: String,
            computed: "_computeImage(value)"
        },
        canOpen: {
            type: Boolean,
            computed: "_computeCanOpen(hasValue, sensitive)"
        }
    }
})
export class PersistentObjectAttributeImage extends PersistentObjectAttribute {
    static get template() { return Polymer.html`<link rel="import" href="persistent-object-attribute-image.html">`; }

    private _pasteListener: EventListener;

    _attributeChanged() {
        if (this._pasteListener) {
            document.removeEventListener("paste", this._pasteListener, false);
            this._pasteListener = null;
        }

        if (this.attribute && this.attribute.getTypeHint("AllowPaste") === "true") {
            this._pasteListener = this._pasteAuto.bind(this);
            document.addEventListener("paste", this._pasteListener, false);
        }
    }

    disconnectedCallback() {
        if (this._pasteListener) {
            document.removeEventListener("paste", this._pasteListener, false);
            this._pasteListener = null;
        }

        super.disconnectedCallback();
    }

    private _change(e: Event) {
        this.attribute.parent.queueWork(() => {
            return new Promise((resolve, reject) => {
                if (!(e.target instanceof HTMLInputElement))
                    return;

                if (e.target.files && e.target.files.length === 1) {
                    const fr = new FileReader();
                    fr.readAsDataURL(e.target.files[0]);
                    fr.onload = () => {
                        resolve(this.value = (<string>fr.result).match(/,(.*)$/)[1]);
                    };
                    fr.onerror = () => {
                        reject(fr.error);
                    };
                }
            });
        }, true);
    }

    private _clear() {
        this.value = null;
    }

    private _computeHasValue(value: string): boolean {
        return !String.isNullOrEmpty(value);
    }

    private _computeImage(value: string): string {
        return value ? value.asDataUri() : "";
    }

    private _computeCanOpen(hasValue: boolean, sensitive: boolean): boolean {
        return hasValue && !sensitive;
    }

    private _pasteAuto(e: ClipboardEvent) {
        if (this.readOnly || !this.editing)
            return;

        if (e.clipboardData) {
            const items = e.clipboardData.items;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf("image") !== -1) {
                        const blob = (<any>items[i]).getAsFile();
                        const URLObj = window["URL"] || window["webkitURL"];
                        const source = URLObj.createObjectURL(blob);
                        this._pasteCreateImage(source);

                        e.preventDefault();
                    }
                }
            }
        }
    }

    private _pasteCreateImage(source) {
        const pastedImage = new Image();
        pastedImage.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = pastedImage.width;
            canvas.height = pastedImage.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(pastedImage, 0, 0);

            this.value = canvas.toDataURL().match(/,(.*)$/)[1];
        };
        pastedImage.src = source;
    }

    private _showDialog() {
        if (!this.value || this.sensitive)
            return;

        this.app.showDialog(new PersistentObjectAttributeImageDialog(this.attribute.label, this.value.asDataUri()));
    }
}

PersistentObjectAttribute.registerAttributeType("Image", PersistentObjectAttributeImage);