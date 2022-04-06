import {Project, ProjectMember} from './protocol';

export class CreateTaskHistory {
    proj: Project;
    creators: ProjectMember[];
    developers: ProjectMember[];
    testers: ProjectMember[];

    constructor() {
        this.proj = null;
        this.creators = [];
        this.developers = [];
        this.testers = [];
    }

    static load(p: Project) {
        let ret = new CreateTaskHistory();
        ret.proj = p;

        let data = JSON.parse(window.localStorage.getItem(`creator_history_${p.id}`));
        if (data) {
            data.c.forEach((c: number) => {
                let idx = p.members.findIndex(v => v.user.id == c); 
                if (idx >= 0) ret.creators.push(p.members[idx]);
            });

            data.d.forEach((d: number) => {
                let idx = p.members.findIndex(v => v.user.id == d); 
                if (idx >= 0) ret.developers.push(p.members[idx]);
            });

            data.t.forEach((t: number) => {
                let idx = p.members.findIndex(v => v.user.id == t); 
                if (idx >= 0) ret.testers.push(p.members[idx]);
            });
        }
        
        return ret;
    }

    save(d: number, t: number, c?: number) {
        if (!this.proj) return;

        let data = {
            c: [] as number[],
            d: [d],
            t: [t],
        };

        this.developers.forEach(d => {if (data.d.length < 5 && data.d.indexOf(d.user.id) == -1) data.d.push(d.user.id);});
        this.testers.forEach(t => {if (data.t.length < 5 && data.t.indexOf(t.user.id) == -1) data.t.push(t.user.id);});

        if (c !== undefined) {
            data.c.push(c);
            this.creators.forEach(c => {if (data.c.length < 5 && data.c.indexOf(c.user.id) == -1) data.c.push(c.user.id);});
        }

        window.localStorage.setItem(`creator_history_${this.proj.id}`, JSON.stringify(data));
    }
};