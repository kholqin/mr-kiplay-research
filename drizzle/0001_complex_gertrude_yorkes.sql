CREATE TABLE `auditActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`actorId` int NOT NULL,
	`entityType` varchar(60) NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(120) NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`findingId` int NOT NULL,
	`ownerId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`url` text NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `findings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`severity` enum('critical','high','medium','low','info') NOT NULL DEFAULT 'info',
	`category` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`remediation` text,
	`status` enum('open','triaged','remediated','accepted','false_positive') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `findings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `researchProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`target` varchar(500) NOT NULL,
	`authorization` text NOT NULL,
	`scope` text NOT NULL,
	`status` enum('planning','in_progress','review','completed','paused') NOT NULL DEFAULT 'planning',
	`complianceChecklist` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `researchProjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowModules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`module` enum('android','web','binary','network','fuzzing','source_analysis','correlation','evidence','reporting') NOT NULL,
	`status` enum('not_started','in_progress','blocked','complete') NOT NULL DEFAULT 'not_started',
	`notes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflowModules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`)
);
