import SvgPuzzle from './svgPuzzle.js';

const RootComponent = {
    data() {
        return {
            darkMode: true,
            parameters: SvgPuzzle.parameters
        };
    },
    watch: {
        darkMode(newValue) {
            if (newValue)
                document.getElementsByTagName('html')[0].classList.add('darkmode');
            else
                document.getElementsByTagName('html')[0].classList.remove('darkmode');
        }
    }
}

const app = Vue.createApp(RootComponent);

app.component("puzzle-renderer", {
    template: `
<div>
    <button @click="saveSvg()" title="save" style="margin-bottom:20px">
        <i class="fas fa-file-export"></i>
    </button>
    {{filename}}
    <div v-html="renderedSvg"></div>
    <div style="opacity: 0" ref="svgMeasure"></div>
</div>`,
    props: {
        parameters: Object
    },
    data() {
        return {
            renderedSvg: "<svg><text>LOADING ...</text></svg>",
            filename: "LOADING ..."
        };
    },
    methods: {
        renderSvg() {
            let renderedSvg = SvgPuzzle.generate();

            if (this.$refs.svgMeasure) {
                this.$refs.svgMeasure.innerHTML = renderedSvg;
                let bbox = this.$refs.svgMeasure.children[0].getBBox({ stroke: true });
                bbox.width = Math.max(0.1, bbox.width);
                bbox.height = Math.max(0.1, bbox.height);

                let viewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;

                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(renderedSvg, "text/xml");

                xmlDoc.children[0].setAttribute("viewBox", viewBox);
                //for export as 96 DPI Inkscape File
                xmlDoc.children[0].setAttribute("width", bbox.width / 3.77952755906 + 'mm');
                xmlDoc.children[0].setAttribute("height", bbox.height / 3.77952755906 + 'mm');

                let serializer = new XMLSerializer();
                renderedSvg = serializer.serializeToString(xmlDoc);
            } else {
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(renderedSvg, "text/xml");
                //for export as 96 DPI Inkscape File
                xmlDoc.children[0].setAttribute("width", this.parameters.width.value + 'mm');
                xmlDoc.children[0].setAttribute("height", this.parameters.height.value + 'mm');

                let serializer = new XMLSerializer();
                renderedSvg = serializer.serializeToString(xmlDoc);
            }

            this.renderedSvg = renderedSvg;
            this.filename = `puzzle${this.parameters.widthCnt.value}x${this.parameters.heightCnt.value} (${this.parameters.width.value} mm x ${this.parameters.height.value} mm).svg`;
        },
        saveSvg() {
            this.triggerDownload('data:image/svg+xml;base64,' + Base64.encode(this.renderedSvg));
        },
        triggerDownload(imgURI) {
            let evt = new MouseEvent('click', {
                view: window,
                bubbles: false,
                cancelable: true
            });

            let a = document.createElement('a');

            a.setAttribute('download', this.filename);
            a.setAttribute('href', imgURI);
            a.setAttribute('target', '_blank');

            a.dispatchEvent(evt);
        }
    },
    watch: {
        $props: {
            handler() {
                this.renderSvg();
            },
            deep: true,
            immediate: true,
        }
    }
});

const vm = app.mount('#app');