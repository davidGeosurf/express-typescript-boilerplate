/**
 * MakeModelCommand
 * -------------------------------------
 *
 */
import * as _ from 'lodash';
import * as inquirer from 'inquirer';
import { AbstractMakeCommand } from './AbstractMakeCommand';
import { MakeMigrationCommand } from './MakeMigrationCommand';
import { askProperties } from './lib/utils';

export class MakeModelCommand extends AbstractMakeCommand {

    static command = 'make:model';
    static description = 'Generate new model';

    public type = 'Model';
    public suffix = '';
    public template = 'model.hbs';
    public target = 'api/models';
    public makeMigrationCommand: MakeMigrationCommand;

    public async run(): Promise<void> {
        await super.run();
        const metaData = await this.askMetaData(this.context);
        this.context = Object.assign(this.context || {}, metaData);

        if (this.context.hasProperties && this.context.properties.length === 0) {
            this.context.properties = await askProperties(this.context);
        }

        if (this.context.hasMigration) {
            this.makeMigrationCommand = new MakeMigrationCommand(this.context);
            await this.makeMigrationCommand.run();
        }
    }

    public async write(): Promise<void> {
        await super.write();
        if (this.context.hasMigration) {
            await this.makeMigrationCommand.write();
        }
    }

    private async askMetaData(context: any): Promise<any> {
        this.context.properties = [];
        const prompt = inquirer.createPromptModule();
        const prompts = await prompt([
            {
                type: 'input',
                name: 'tableName',
                message: 'Add the database table:',
                filter: (value: any) => _.snakeCase(value),
                validate: (value: any) => !!value
            }, {
                type: 'confirm',
                name: 'hasTimestamps',
                message: 'Has timestamps?',
                default: true
            }, {
                type: 'confirm',
                name: 'hasMigration',
                message: 'Has a migration file?',
                default: true
            }, {
                type: 'confirm',
                name: 'hasProperties',
                message: 'Do you want to add some properties?',
                default: true,
                when: () => this.context.properties.length === 0
            }
        ]);
        return _.assign(context, prompts);
    }

}
