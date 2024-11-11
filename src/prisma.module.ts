import {Module, Global} from "@nestjs/common";

import {PrismaService} from "@chimera/prisma";

@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService]
})
export class PrismaModule {}
