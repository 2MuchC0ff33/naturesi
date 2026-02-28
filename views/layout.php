<!DOCTYPE html>
<html lang="en">
<head>
    <?php $this->insert('partials/head_meta'); ?>
</head>
<body>
    <?php $this->insert('partials/header'); ?>

    <main>
        <?php echo $this->section('content'); ?>
    </main>

    <?php $this->insert('partials/footer'); ?>
</body>
</html>
